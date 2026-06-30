import "@/styles/cms-content.css";

type CmsPageBodyProps = {
  html: string;
  className?: string;
};

/**
 * Renders Odoo website.page HTML inside the Next.js site shell.
 * Odoo asset URLs should already be rewritten to absolute Odoo URLs.
 */
export function CmsPageBody({ html, className }: CmsPageBodyProps) {
  return (
    <article
      className={className ?? "aptus-cms-content"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
