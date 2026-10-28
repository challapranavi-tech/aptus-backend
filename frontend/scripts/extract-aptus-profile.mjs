/**
 * Extract text + key-project images from docx-tmp/Aptus profile - 2026.pdf
 * Outputs: docx-tmp/aptus-profile-2026.txt, docx-tmp/profile-images/*
 * Then run: node frontend/scripts/build-key-projects-from-profile.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pdfPath = path.join(root, "docx-tmp/Aptus profile  - 2026.pdf");
const txtPath = path.join(root, "docx-tmp/aptus-profile-2026.txt");
const imageDir = path.join(root, "docx-tmp/profile-images");

async function main() {
  const buf = await readFile(pdfPath);
  const parser = new PDFParse({ data: buf });

  const textResult = await parser.getText();
  await writeFile(txtPath, textResult.text);
  console.log("Wrote", txtPath, `(${textResult.total} pages)`);

  await mkdir(imageDir, { recursive: true });
  const imgs = await parser.getImage({
    partial: [9, 10, 11, 12, 13, 14, 15, 16],
    imageThreshold: 100,
  });
  await parser.destroy();

  let saved = 0;
  for (const page of imgs.pages) {
    for (const [i, img] of page.images.entries()) {
      const ext = img.name?.split(".").pop()?.toLowerCase() || "jpg";
      const fname = `page${page.pageNumber}-img${i}.${ext}`;
      await writeFile(path.join(imageDir, fname), img.data);
      saved++;
    }
  }
  console.log("Saved", saved, "images to", imageDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
