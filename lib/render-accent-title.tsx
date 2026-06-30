import type { AccentTitleContent } from "@/types/case-studies-page";

export function joinAccentTitle(title: AccentTitleContent): string {
  return [title.before, title.accent, title.after].filter(Boolean).join(" ");
}

export function renderAccentTitle(title: AccentTitleContent) {
  return (
    <>
      {title.before ? <>{title.before} </> : null}
      {title.accent}
      {title.after ? <> {title.after}</> : null}
    </>
  );
}
