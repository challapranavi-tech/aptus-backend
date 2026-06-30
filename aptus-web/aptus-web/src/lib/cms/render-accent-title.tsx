import type { AccentTitleContent } from "@/types/sections";
import { AccentSpan } from "@/components/ui/SectionHeading";

/** Renders CMS accent title parts as React nodes. */
export function renderAccentTitle(title: AccentTitleContent) {
  return (
    <>
      {title.before ? <>{title.before} </> : null}
      <AccentSpan>{title.accent}</AccentSpan>
      {title.after ? <> {title.after}</> : null}
    </>
  );
}
