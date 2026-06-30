import { createAboutPageHandlers } from "@/lib/cms/create-about-page";

const { generateMetadata, default: AboutUsPage } = createAboutPageHandlers("aboutUs");

export { generateMetadata };
export default AboutUsPage;
