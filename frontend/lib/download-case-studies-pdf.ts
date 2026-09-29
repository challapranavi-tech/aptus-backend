import { jsPDF } from "jspdf";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { CaseStudyItemContent } from "@/types/case-studies-page";

type PdfImage = {
  dataUrl: string;
  format: "JPEG" | "PNG" | "WEBP";
  width: number;
  height: number;
};

function absoluteImageUrl(src: string): string {
  const resolved = resolveCmsImageSrc(src);
  if (/^https?:\/\//i.test(resolved)) return resolved;
  if (typeof window === "undefined") return resolved;
  return new URL(resolved, window.location.origin).toString();
}

function detectImageFormat(dataUrl: string, mime: string): PdfImage["format"] {
  if (mime.includes("png") || dataUrl.startsWith("data:image/png")) return "PNG";
  if (mime.includes("webp") || dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

async function loadImage(src: string): Promise<PdfImage | null> {
  try {
    const url = absoluteImageUrl(src);
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(blob);
    });
    if (!dataUrl.startsWith("data:image/")) return null;

    const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.src = dataUrl;
    });

    return {
      dataUrl,
      format: detectImageFormat(dataUrl, blob.type || ""),
      width: dims.width,
      height: dims.height,
    };
  } catch {
    return null;
  }
}

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text.replace(/\s+/g, " ").trim(), maxWidth);
}

function fileSlug(parts: Array<string | null | undefined>): string {
  const label = parts.filter(Boolean).join("-") || "all-projects";
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function downloadFilteredProjectsPdf(input: {
  projects: CaseStudyItemContent[];
  industry?: string | null;
  category?: string | null;
}): Promise<void> {
  const projects = input.projects;
  if (!projects.length) {
    throw new Error("No projects to download for the current filter.");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const marginTop = 16;
  const marginBottom = 16;
  const contentWidth = pageWidth - marginX * 2;
  const imageWidth = 42;
  const gap = 8;
  const textWidth = contentWidth - imageWidth - gap;

  const filterBits = [
    input.category ? input.category.toUpperCase() : null,
    input.industry && input.industry !== "All" ? input.industry : null,
  ].filter(Boolean);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(19, 82, 163);
  doc.text("Aptus Infotech — Solutions in Action", marginX, marginTop);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(70, 80, 95);
  const subtitle = filterBits.length
    ? `Filtered projects: ${filterBits.join(" · ")}`
    : "All key projects";
  doc.text(subtitle, marginX, marginTop + 7);

  let y = marginTop + 16;

  for (const project of projects) {
    const image = project.imageSrc ? await loadImage(project.imageSrc) : null;
    const imageHeight = image
      ? Math.min(36, (imageWidth * image.height) / image.width)
      : 0;

    doc.setFont("helvetica", "bold");
    const titleLines = wrapText(doc, project.title, textWidth, 11);
    const titleHeight = titleLines.length * 5.2;

    doc.setFont("helvetica", "normal");
    const industryLine = project.industry?.trim()
      ? wrapText(doc, project.industry.trim().toUpperCase(), textWidth, 8)
      : [];
    const industryHeight = industryLine.length ? industryLine.length * 4 + 1 : 0;

    const descriptionLines = wrapText(doc, project.description, textWidth, 9.5);
    const descriptionHeight = descriptionLines.length * 4.6;

    const textBlockHeight = titleHeight + industryHeight + 2 + descriptionHeight;
    const blockHeight = Math.max(imageHeight || 28, textBlockHeight) + 8;

    if (y + blockHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }

    const imageX = marginX;
    const textX = marginX + imageWidth + gap;

    if (image) {
      try {
        doc.addImage(image.dataUrl, image.format, imageX, y, imageWidth, imageHeight, undefined, "FAST");
      } catch {
        doc.setDrawColor(210, 218, 230);
        doc.setFillColor(245, 248, 252);
        doc.roundedRect(imageX, y, imageWidth, 28, 2, 2, "FD");
      }
    } else {
      doc.setDrawColor(210, 218, 230);
      doc.setFillColor(245, 248, 252);
      doc.roundedRect(imageX, y, imageWidth, 28, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 150, 165);
      doc.text("No photo", imageX + 12, y + 15);
    }

    let textY = y + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(11, 31, 58);
    doc.text(titleLines, textX, textY);
    textY += titleHeight + 1;

    if (industryLine.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(19, 82, 163);
      doc.text(industryLine, textX, textY);
      textY += industryHeight;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 80);
    doc.text(descriptionLines, textX, textY + 2);

    y += blockHeight;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, y - 3, pageWidth - marginX, y - 3);
  }

  const filename = `aptus-solutions-in-action-${fileSlug([
    input.category,
    input.industry && input.industry !== "All" ? input.industry : null,
  ])}.pdf`;

  doc.save(filename);
}
