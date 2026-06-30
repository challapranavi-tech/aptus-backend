import { createAboutPageHandlers } from "@/lib/cms/create-about-page";

const { generateMetadata, default: WhyAptusPage } = createAboutPageHandlers("whyAptus");

export { generateMetadata };
export default WhyAptusPage;
