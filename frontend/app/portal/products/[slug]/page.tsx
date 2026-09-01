import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Product details are public at /software-solutions/[slug]. */
export default async function PortalProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/software-solutions/${slug}`);
}
