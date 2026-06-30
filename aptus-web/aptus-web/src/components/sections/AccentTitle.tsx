import { AccentSpan } from "@/components/ui/SectionHeading";
import type { AccentTitleContent } from "@/types/sections";

export function AccentTitle({ before, accent, after }: AccentTitleContent) {
  return (
    <>
      {before} <AccentSpan>{accent}</AccentSpan>
      {after ? ` ${after}` : null}
    </>
  );
}
