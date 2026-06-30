/**
 * Generates src/lib/cms/site-nav.ts from aptusinfotech.com menu.
 * Usage: node scripts/generate-site-nav.mjs
 */

import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const html = await (await fetch("https://aptusinfotech.com/")).text();
const idIdx = html.indexOf('id="menu-1-736d1b7"');
if (idIdx < 0) throw new Error("Main menu not found on aptusinfotech.com");

const ulStart = html.lastIndexOf("<ul", idIdx);
const ulOpenEnd = html.indexOf(">", ulStart);
let depth = 1;
let i = ulOpenEnd + 1;

while (i < html.length && depth > 0) {
  const nextOpen = html.indexOf("<ul", i);
  const nextClose = html.indexOf("</ul>", i);
  if (nextClose === -1) break;
  if (nextOpen !== -1 && nextOpen < nextClose) {
    depth += 1;
    i = nextOpen + 4;
  } else {
    depth -= 1;
    i = nextClose + 5;
  }
}

const menuHtml = html.slice(ulOpenEnd + 1, i - 5);

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .trim();
}

function normalizeHref(href) {
  let pathName = href.trim();
  if (pathName.startsWith("https://aptusinfotech.com")) {
    pathName = pathName.replace("https://aptusinfotech.com", "") || "/";
  }
  if (pathName.endsWith("/") && pathName.length > 1) pathName = pathName.slice(0, -1);
  if (pathName === "/software-solutions") return "/software";
  return pathName;
}

const GROUP_HREF_BY_LABEL = {
  "About Us": "/about-us",
  Software: "/software",
  "ELV Solutions": "/elv-solutions",
};

function resolveHref(label, href, hasChildren) {
  if (href !== "#") return normalizeHref(href);
  if (GROUP_HREF_BY_LABEL[label]) return GROUP_HREF_BY_LABEL[label];
  if (hasChildren) return undefined;
  return null;
}

function parseList(fragment) {
  const items = [];
  let cursor = 0;

  while (cursor < fragment.length) {
    const liStart = fragment.indexOf("<li ", cursor);
    if (liStart === -1) break;

    const liOpenEnd = fragment.indexOf(">", liStart);
    let liDepth = 1;
    let pos = liOpenEnd + 1;

    while (pos < fragment.length && liDepth > 0) {
      const open = fragment.indexOf("<li", pos);
      const close = fragment.indexOf("</li>", pos);
      if (close === -1) break;
      if (open !== -1 && open < close) {
        liDepth += 1;
        pos = open + 3;
      } else {
        liDepth -= 1;
        pos = close + 5;
      }
    }

    const block = fragment.slice(liStart, pos);
    cursor = pos;

    const linkMatch = block.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (!linkMatch) continue;

    const rawHref = linkMatch[1].trim();
    const label = decodeHtml(linkMatch[2].replace(/<[^>]+>/g, ""));
    if (!label) continue;

    const subStart = block.indexOf('<ul class="sub-menu');
    let children;
    if (subStart !== -1) {
      const subUlStart = block.indexOf("<ul", subStart);
      const subUlOpenEnd = block.indexOf(">", subUlStart);
      let subDepth = 1;
      let subPos = subUlOpenEnd + 1;
      while (subPos < block.length && subDepth > 0) {
        const open = block.indexOf("<ul", subPos);
        const close = block.indexOf("</ul>", subPos);
        if (close === -1) break;
        if (open !== -1 && open < close) {
          subDepth += 1;
          subPos = open + 4;
        } else {
          subDepth -= 1;
          subPos = close + 5;
        }
      }
      children = parseList(block.slice(subUlOpenEnd + 1, subPos - 5));
    }

    const href = resolveHref(label, rawHref, Boolean(children?.length));
    if (href === null && !children?.length) continue;

    const node = { label };
    if (href) node.href = href;
    if (children?.length) node.children = children;
    items.push(node);
  }

  return items;
}

const nav = parseList(menuHtml);

function serializeNode(node, indent) {
  const pad = " ".repeat(indent);
  const inner = " ".repeat(indent + 2);
  const lines = [`${pad}{`, `${inner}label: ${JSON.stringify(node.label)},`];
  if (node.href) lines.push(`${inner}href: ${JSON.stringify(node.href)},`);
  if (node.children?.length) {
    lines.push(`${inner}children: [`);
    for (const child of node.children) {
      lines.push(serializeNode(child, indent + 4) + ",");
    }
    lines.push(`${inner}],`);
  }
  lines.push(`${pad}}`);
  return lines.join("\n");
}

const body = nav.map((node) => serializeNode(node, 2)).join(",\n");

const file = `/** Main site navigation — synced from https://aptusinfotech.com/ (run \`npm run cms:sync-nav\`). */

export type SiteNavLink = {
  label: string;
  href?: string;
  children?: SiteNavLink[];
};

export const NAV_ITEMS: SiteNavLink[] = [
${body}
];
`;

writeFileSync(path.join(ROOT, "src/lib/cms/site-nav.ts"), file, "utf8");
console.log(`Wrote src/lib/cms/site-nav.ts (${nav.length} top-level items)`);
