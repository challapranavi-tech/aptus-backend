import { createAboutPageHandlers } from "@/lib/cms/create-about-page";

const { generateMetadata, default: IsoCertificationsPage } =
  createAboutPageHandlers("isoCertifications");

export { generateMetadata };
export default IsoCertificationsPage;
