import { createAboutPageHandlers } from "@/lib/cms/create-about-page";

const { generateMetadata, default: OurTeamPage } = createAboutPageHandlers("ourTeam");

export { generateMetadata };
export default OurTeamPage;
