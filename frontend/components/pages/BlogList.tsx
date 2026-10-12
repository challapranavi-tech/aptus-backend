import { Container } from "@/components/ui";
import blog from "@/content/blog.json";

const BRAND_IMAGE: Record<string, string> = {
  Autodesk: "/images/oman-tech-hero.jpg",
  Microsoft: "/images/Aptusinfo.jpg",
  Adobe: "/images/adobe-banner.jpg",
  "Trimble SketchUp": "/images/3d-683x1024.png",
  Oracle: "/images/about_banner-e1746943143932.jpg",
  Mitel: "/images/av-signage.jpg",
  "Axis Communications": "/images/Access-Control-System-1-1024x1020.png",
  Fortinet: "/images/Leonardo_Phoenix_10_a_cinematic_photograph_of_a_futuristic_dat_0-673x1024.jpg",
  Sophos: "/images/ncs-monitoring.jpg",
  Vertiv: "/images/ups-monitoring.jpg",
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
            const image = BRAND_IMAGE[item.brand] ?? "/images/oman-tech-hero.jpg";
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
