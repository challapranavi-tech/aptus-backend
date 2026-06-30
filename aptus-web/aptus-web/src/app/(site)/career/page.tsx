import { createAboutPageHandlers } from "@/lib/cms/create-about-page";

const { generateMetadata, default: CareerPage } = createAboutPageHandlers("career");

export { generateMetadata };
export default CareerPage;
