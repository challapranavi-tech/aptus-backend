import { createAboutPageHandlers } from "@/lib/cms/create-about-page";

const { generateMetadata, default: OurStoryPage } = createAboutPageHandlers("ourStory");

export { generateMetadata };
export default OurStoryPage;
