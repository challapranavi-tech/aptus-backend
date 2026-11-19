import { getRequestLocale } from "@/lib/request-locale";
import { translateToArabic } from "@/lib/translate-text";
import type { Metadata } from "next";

function titleText(title: Metadata["title"]): string | undefined {
  if (!title) return undefined;
  if (typeof title === "string") return title;
  if ("absolute" in title && title.absolute) return title.absolute;
  if ("default" in title && typeof title.default === "string") return title.default;
  return undefined;
}

/** Apply the shared Arabic list (then the cached translator) to title and description. */
export async function withArabicMeta(meta: Metadata): Promise<Metadata> {
  const locale = await getRequestLocale();
  if (locale !== "ar") return meta;

  const title = titleText(meta.title);
  const description = typeof meta.description === "string" ? meta.description : "";
  const og = meta.openGraph;
  const ogTitle = og && typeof og.title === "string" ? og.title : "";
  const ogDescription = og && typeof og.description === "string" ? og.description : "";
  const [nextTitle, nextDescription, nextOgTitle, nextOgDescription] = await translateToArabic([
    title ?? "",
    description,
    ogTitle,
    ogDescription,
  ]);

  const out: Metadata = { ...meta };
  if (title && nextTitle) {
    if (typeof meta.title === "object" && meta.title && "default" in meta.title) {
      out.title = { ...meta.title, default: nextTitle };
    } else {
      out.title = nextTitle;
    }
  }
  if (description && nextDescription) out.description = nextDescription;
  if (og && (nextOgTitle || nextOgDescription)) {
    out.openGraph = {
      ...og,
      ...(ogTitle && nextOgTitle ? { title: nextOgTitle } : {}),
      ...(ogDescription && nextOgDescription ? { description: nextOgDescription } : {}),
    };
  }
  return out;
}
