/**
 * Extract plain text from docx-tmp/*.docx into docx-tmp/*.txt for the product detail importer.
 * Usage: node frontend/scripts/extract-docx-tmp.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const docxDir = path.join(root, "docx-tmp");

const DOCX_TO_TXT = [
  ["Product detailing - Software with renewals.docx", "renewals.txt"],
  ["Product detailing with Levels.docx", "levels.txt"],
  ["Products - Single Bundle.docx", "bundle.txt"],
];

const psScript = String.raw`
param([string]$DocxPath, [string]$OutPath)
$temp = Join-Path $env:TEMP ("docx-extract-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $temp -Force | Out-Null
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
Remove-Item -Recurse -Force $temp
`;

const psFile = path.join(os.tmpdir(), "extract-docx-tmp.ps1");
fs.writeFileSync(psFile, psScript, "utf8");

let ok = 0;
for (const [docxName, txtName] of DOCX_TO_TXT) {
  const docxPath = path.join(docxDir, docxName);
  const outPath = path.join(docxDir, txtName);
  if (!fs.existsSync(docxPath)) {
    console.warn(`Skip (missing): ${docxName}`);
    continue;
  }
  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psFile, "-DocxPath", docxPath, "-OutPath", outPath],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    console.error(`Failed: ${docxName}`);
    process.exit(1);
  }
  console.log(`Wrote ${txtName} from ${docxName}`);
  ok += 1;
}

console.log(`extract-docx-tmp: ok (${ok} files)`);
