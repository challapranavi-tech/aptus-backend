import { createAboutPageHandlers } from "@/lib/cms/create-about-page";

const { generateMetadata, default: WinningTogetherPage } = createAboutPageHandlers("winningTogether");

export { generateMetadata };
export default WinningTogetherPage;
