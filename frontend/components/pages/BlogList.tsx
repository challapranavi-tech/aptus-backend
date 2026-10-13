import { Container } from "@/components/ui";
import blog from "@/content/blog.json";

/** One photo per article. Same brand must not reuse a tile image. */
const ARTICLE_IMAGE: Record<string, string> = {
  "autocad-2027-redefining-how-you-create-collaborate-and-deliver":
    "/images/oman-tech-hero.jpg",
  "what-s-new-in-revit-2027-a-smarter-more-connected-way-to-work":
    "/images/home-lighting.jpg",
  "what-s-new-in-revit-2027-1": "/images/grms-hero-lobby.jpg",
  "what-s-new-in-revit-2027-2": "/images/grms-hero-suite.jpg",
  "introducing-the-revit-public-mcp-server": "/images/grms-automation.jpg",
  "microsoft-365-business-with-copilot-the-new-standard-for-small-business":
    "/images/Aptusinfo.jpg",
  "acrobat-studio-a-trusted-platform-for-business-intelligence-and-creativity":
    "/images/adobe-banner.jpg",
  "adobe-s-new-productivity-agent-redefining-how-we-understand-create-and-share":
    "/images/conf-huddle.jpg",
  "show-up-sharper-faster-with-new-acrobat-ai": "/images/conf-hybrid.jpg",
  "adobe-acrobat-ai-assistant-for-enterprise-a-commitment-to-security":
    "/images/net-security.jpg",
  "meet-firefly-graph-reusable-creative-workflows-with-generative-ai":
    "/images/av-videowall.jpg",
  "will-ai-enhance-the-design-process": "/images/3d-683x1024.png",
  "ai-in-architecture-keeping-human-creativity-at-the-center":
    "/images/about_banner-e1746943143932.jpg",
  "new-oracle-aconex-capabilities-improve-project-transparency-and-control":
    "/images/conf-boardroom.jpg",
  "oracle-transforms-construction-safety-management-with-ai":
    "/images/therm-checkpoint.jpg",
  "oracle-primavera-cloud-achieves-fedramp-in-process-designation":
    "/images/conf-control.jpg",
  "hosted-pbx-the-complete-enterprise-guide": "/images/voip-benefits-01.jpg",
  "hosted-pbx-vs-on-premises-pbx-what-control-really-costs-you":
    "/images/av-pa.jpg",
  "benefits-of-hosted-pbx-for-remote-hybrid-work": "/images/conf-wireless.jpg",
  "hosted-pbx-migration-best-practices": "/images/net-fiber.jpg",
  "what-is-physical-access-control-a-guide-to-securing-your-facility":
    "/images/Access-Control-System-1-1024x1020.png",
  "cloud-video-surveillance-explained": "/images/acs-visitor.jpg",
  "what-are-the-cybersecurity-issues-in-video-surveillance":
    "/images/acs-locks.jpg",
  "fortiendpoint-expands-security-for-the-ai-era": "/images/ncs-monitoring.jpg",
  "fortios-8-0-redefining-secure-networking-in-the-ai-and-quantum-era":
    "/images/Leonardo_Phoenix_10_a_cinematic_photograph_of_a_futuristic_dat_0-673x1024.jpg",
  "fortiaigate-optimizing-and-protecting-ai-workloads": "/images/ncs-alerts.jpg",
  "while-ot-security-is-maturing-risk-is-not-slowing-down":
    "/images/switch-monitor.jpg",
  "the-state-of-ransomware-2026": "/images/ncs-emergency.jpg",
  "stopping-real-world-attacks-lessons-from-the-2026-cyber-frontline":
    "/images/net-enterprise.jpg",
  "5-common-ups-battery-mistakes-and-how-to-avoid-them":
    "/images/ups-battery-backup.jpg",
};

export function BlogList() {
  return (
    <section className="aptus-blog" data-section="blog">
      <Container>
        <header className="aptus-blog__header">
          <h1 className="aptus-blog__title">{blog.title}</h1>
        </header>
        <div className="aptus-blog__grid">
          {blog.items.map((item) => {
            const image = ARTICLE_IMAGE[item.id] ?? "/images/oman-tech-hero.jpg";
            return (
              <article key={item.id} className="aptus-blog__card">
                <a
                  className="aptus-blog__media"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.title}
                >
                  <img src={image} alt="" />
                </a>
                <div className="aptus-blog__body">
                  <h2 className="aptus-blog__name">{item.title}</h2>
                  <p className="aptus-blog__brand">{item.brand}</p>
                  <p className="aptus-blog__intro">{item.summary}</p>
                  <a
                    className="aptus-blog__more"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View more
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
