/**
 * Extract text + images from docx-tmp/projects.docx for Solutions in Action key projects.
 * Usage: node frontend/scripts/extract-projects-docx.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const docxPath = path.join(root, "docx-tmp/projects.docx");
const txtPath = path.join(root, "docx-tmp/projects.txt");
const imageDir = path.join(root, "docx-tmp/projects-images");

const psScript = String.raw`
param([string]$DocxPath, [string]$OutPath, [string]$ImageDir)
$temp = Join-Path $env:TEMP ("projects-docx-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $temp -Force | Out-Null
New-Item -ItemType Directory -Path $ImageDir -Force | Out-Null
Copy-Item $DocxPath "$temp\doc.zip"
Expand-Archive "$temp\doc.zip" "$temp\extracted" -Force

[xml]$xml = Get-Content "$temp\extracted\word\document.xml" -Encoding UTF8
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
$lines = New-Object System.Collections.Generic.List[string]
foreach ($p in $xml.SelectNodes("//w:p", $ns)) {
  $parts = @()
  foreach ($t in $p.SelectNodes(".//w:t", $ns)) {
    if ($t.InnerText) { $parts += $t.InnerText }
  }
  $line = ($parts -join "").Trim()
  if ($line.Length -gt 0) { [void]$lines.Add($line) }
}
$lines -join [Environment]::NewLine | Set-Content -Path $OutPath -Encoding UTF8

$media = Join-Path $temp "extracted\word\media"
if (Test-Path $media) {
  Get-ChildItem $media | ForEach-Object {
    if ($_.Length -ge 8000) {
      Copy-Item $_.FullName (Join-Path $ImageDir $_.Name) -Force
    }
  }
}

Remove-Item -Recurse -Force $temp
`;

const psFile = path.join(os.tmpdir(), "extract-projects-docx.ps1");
fs.writeFileSync(psFile, psScript, "utf8");

if (!fs.existsSync(docxPath)) {
  console.error("Missing", docxPath);
  process.exit(1);
}

const result = spawnSync(
  "powershell",
  [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    psFile,
    "-DocxPath",
    docxPath,
    "-OutPath",
    txtPath,
    "-ImageDir",
    imageDir,
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) process.exit(1);

const images = fs.existsSync(imageDir)
  ? fs
      .readdirSync(imageDir)
      .filter((name) => /^image\d+\./i.test(name))
      .sort((a, b) => {
        const na = Number(a.match(/\d+/)?.[0] ?? 0);
        const nb = Number(b.match(/\d+/)?.[0] ?? 0);
        return na - nb;
      })
  : [];

console.log(`Wrote ${txtPath}`);
console.log(`Copied ${images.length} project images to ${imageDir}`);
