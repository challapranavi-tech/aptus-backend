import { createAboutPageHandlers } from "@/lib/cms/create-about-page";

const { generateMetadata, default: AptusPolicyPage } = createAboutPageHandlers("aptusPolicy");

export { generateMetadata };
export default AptusPolicyPage;
