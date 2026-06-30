import Image, { type ImageProps } from "next/image";

type CmsImageProps = Omit<ImageProps, "unoptimized"> & {
  src: string;
};

/** ponytail: unoptimized — Next image optimizer DNS-fetches WP media server-side; bypass for CMS URLs */
export function CmsImage({ src, alt = "", ...props }: CmsImageProps) {
  return <Image src={src} alt={alt} unoptimized {...props} />;
}
