/**
 * Rewrites Odoo-relative asset URLs so images and links resolve when HTML
 * is rendered on the Next.js origin instead of the Odoo domain.
 */
export function rewriteOdooHtml(html: string, odooBaseUrl: string): string {
  const base = odooBaseUrl.replace(/\/$/, "");
  if (!html || !base) return html;

  let output = html;

  // src="/web/..." and href='/web/...'
  output = output.replace(
    /(\s(?:src|href|data-src|data-original-src|data-bg-src)=)(["'])\/web\//gi,
    `$1$2${base}/web/`,
  );

  // Inline styles: background-image: url('/web/...') or url(/web/...)
  output = output.replace(/url\(\s*(["']?)\/web\//gi, `url($1${base}/web/`);

  // Odoo snippet background classes referencing /web/image
  output = output.replace(
    /(background-image:\s*url\(\s*["']?)\/web\//gi,
    `$1${base}/web/`,
  );

  return output;
}

/**
 * Odoo "Embed Code" snippets often contain a full HTML document (meta, link, style,
 * header, footer, script). Strip document-level tags and defang global CSS so the
 * fragment can render safely inside the Next.js site shell.
 */
export function sanitizeOdooCmsHtml(html: string): string {
  if (!html) return html;

  let output = html;

  // Inert duplicate saved in s_embed_code snippets.
  output = output.replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, "");

  output = output.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  output = output.replace(/<link\b[^>]*>/gi, "");
  output = output.replace(/<meta\b[^>]*>/gi, "");
  output = output.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "");

  output = output.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_match, attrs, css) => {
    const scoped = String(css)
      // Universal reset breaks the host page layout and icon sizing.
      .replace(/^\s*\*\s*\{[^}]*\}\s*/gm, "")
      // Scope document-level selectors to the CMS wrapper.
      .replace(/\bbody\s*\{/g, ".aptus-cms-content {")
      .replace(/\bhtml\s*\{/g, ".aptus-cms-content {");

    return `<style${attrs}>${scoped}</style>`;
  });

  return output.trim();
}

/**
 * Odoo website.page stores QWeb view templates (with <t t-call="website.layout">).
 * Browsers cannot render QWeb — extract the inner #wrap HTML for Next.js.
 */
export function extractWebsitePageHtml(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (!trimmed.includes("<t ") && !trimmed.includes("<t>")) {
    return trimmed;
  }

  const wrapMatch = trimmed.match(/<div id="wrap"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/t>\s*)*$/i);
  if (wrapMatch?.[1]?.trim()) {
    return wrapMatch[1].trim();
  }

  const oeMatch = trimmed.match(
    /<div class="oe_structure"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/t>/i,
  );
  if (oeMatch?.[1]?.trim()) {
    return oeMatch[1].trim();
  }

  const stripped = trimmed
    .replace(/<t[^>]*>/gi, "")
    .replace(/<\/t>/gi, "")
    .trim();

  return stripped || null;
}

export function pickPageHtml(page: {
  arch_db?: string | false | null;
  arch?: string | false | null;
}): string | null {
  const archDb = typeof page.arch_db === "string" ? page.arch_db : "";
  const fromArchDb = extractWebsitePageHtml(archDb);
  if (fromArchDb) return fromArchDb;

  const arch = typeof page.arch === "string" ? page.arch : "";
  const fromArch = extractWebsitePageHtml(arch);
  if (fromArch) return fromArch;

  return null;
}
