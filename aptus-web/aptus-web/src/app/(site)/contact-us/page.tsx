import { createAboutPageHandlers } from "@/lib/cms/create-about-page";

const { generateMetadata, default: ContactUsPage } = createAboutPageHandlers("contactUs");

export { generateMetadata };
export default ContactUsPage;
