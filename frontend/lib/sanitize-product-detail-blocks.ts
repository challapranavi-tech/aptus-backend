import type { ProductDetailBlock } from "@/data/product-detail-content";

const PAGE_MARKER = /--\s*\d+\s+of\s+\d+\s*--/gi;

function cleanText(text: string): string {
  return text
    .replace(PAGE_MARKER, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*:\s*/, "")
    .trim();
}

function extractBulletItems(text: string): string[] {
  const cleaned = cleanText(text);
  if (!cleaned) return [];

  if (!/[\uF0B7\u2022]/.test(cleaned)) {
    return [cleaned];
  }

  return cleaned
    .split(/(?:^|\s*:\s*)[\uF0B7\u2022]\s+/)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function normalizeParagraph(text: string): ProductDetailBlock[] {
  const items = extractBulletItems(text);
  if (items.length > 1) {
    return [{ type: "ul", items }];
  }
  if (items.length === 1) {
    return [{ type: "p", text: items[0]! }];
  }
  return [];
}

function isOverviewHeading(text: string): boolean {
  return text.trim().toLowerCase() === "overview";
}

function normalizeBlock(block: ProductDetailBlock): ProductDetailBlock[] {
  if (block.type === "p") {
    return normalizeParagraph(block.text);
  }

  if (block.type === "h3") {
    const text = cleanText(block.text);
    if (!text || isOverviewHeading(text)) return [];
    return [{ type: "h3", text }];
  }

  if (block.type === "ul") {
    const items = block.items.flatMap((item) => extractBulletItems(item)).filter(Boolean);
    return items.length ? [{ type: "ul", items }] : [];
  }

  const headers = block.headers.map((header) => cleanText(header)).filter(Boolean);
  const rows = block.rows
    .map((row) => row.map((cell) => cleanText(cell)))
    .filter((row) => row.some((cell) => cell && !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(cell)));

  if (!headers.length || !rows.length) return [];
  return [{ type: "table", headers, rows }];
}

/** Cleans PDF extract noise (page markers, inline bullets, stray Overview headings). */
export function sanitizeProductDetailBlocks(
  blocks: ProductDetailBlock[],
  tabId?: string,
): ProductDetailBlock[] {
  const normalized = blocks.flatMap((block) => normalizeBlock(block));

  if (tabId !== "overview") return normalized;

  return normalized.filter((block) => {
    if (block.type === "p" && isOverviewHeading(block.text)) return false;
    if (block.type === "h3" && isOverviewHeading(block.text)) return false;
    return true;
  });
}
