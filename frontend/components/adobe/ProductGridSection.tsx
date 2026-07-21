import styles from "@/styles/adobe/adobe.module.css";
import { DeadLink } from "./DeadLink";

const PRODUCTS = [
  {
    icon: '/adobe-assets/firefly-appicon-256.svg',
    name: 'Firefly',
    body: 'Create and enhance images, video, and audio with AI-powered tools.',
    bgImage: 'https://www.adobe.com/upp-shared/media_177ad1e4e1f2ff11992428f533093c4766d7e730a.png?width=2000&format=webply&optimize=medium',
  },
  {
    icon: '/adobe-assets/acrobat-pro.svg',
    name: 'Adobe Acrobat',
    body: 'The complete AI-powered PDF and design solution for business workflows.',
    bgImage: 'https://www.adobe.com/upp-shared/media_1824349e98ea332d56e0c46ad3885f15f81e81d9c.png?width=2000&format=webply&optimize=medium',
  },
  {
    icon: '/adobe-assets/photoshop.svg',
    name: 'Photoshop',
    body: 'Create gorgeous images, rich graphics, and incredible art.',
    bgImage: 'https://www.adobe.com/upp-shared/media_1dddcf68e4f8faee75c049540af63a1d8665eef63.png?width=2000&format=webply&optimize=medium',
  },
  {
    icon: '/adobe-assets/premiere-pro.svg',
    name: 'Premiere',
    body: 'Create everything from social clips to feature films with the leading video editor.',
    bgImage: 'https://www.adobe.com/upp-shared/media_192364a2460d346d635169225d1a899bd7ded0fb5.png?width=2000&format=webply&optimize=medium',
  },
  {
    icon: '/adobe-assets/creative-cloud.svg',
    name: 'Creative Cloud',
    body: 'Get 20+ apps, including Photoshop, Illustrator, Premiere Pro, and Acrobat Pro.',
    bgImage: 'https://www.adobe.com/upp-shared/media_154cf82df7f4b5adf9cbf8ba16e799bc802b464c7.png?width=2000&format=webply&optimize=medium',
  },
  {
    icon: '/adobe-assets/experience-cloud-logo.svg',
    name: 'GenStudio',
    body: 'Scale your content supply chain.',
    bgImage: 'https://www.adobe.com/upp-shared/media_1f81c5db554aa9ec0e514f9d3cb5ea60dc2b41353.png?width=2000&format=webply&optimize=medium',
  },
  {
    icon: '/adobe-assets/experience-cloud-logo.svg',
    name: 'Business Products',
    body: 'Adobe solutions integrate our best-in-class products to help you tackle pressing business challenges.',
    bgImage: 'https://www.adobe.com/upp-shared/media_16a12df2eb12e5db3e1b23402493892b912e73c49.png?width=2000&format=webply&optimize=medium',
  },
  {
    icon: '/adobe-assets/illustrator.svg',
    name: 'Illustrator',
    body: 'Design precision vector graphics—from branding to illustration—that stay sharp at any size.',
    bgImage: 'https://www.adobe.com/upp-shared/media_1a019b385c3351c3d1bc776b3847795e8052dbe7d.png?width=2000&format=webply&optimize=medium',
  },
  {
    icon: '/adobe-assets/all-products.svg',
    name: 'All products',
    body: 'See all Adobe products',
    bgImage: 'https://www.adobe.com/upp-shared/media_18a0d69e96cb45c92f26c58399659d2e44094ce8d.png?width=2000&format=webply&optimize=medium',
  },
];

export function ProductGridSection() {
  return (
    <section className={styles.productGridSection} aria-label="Adobe product catalog">
      <div className={styles.productGridInner}>
        {PRODUCTS.map((p, i) => (
          <div key={i} className={styles.exploreCard}>
            <div className={styles.exploreCardBg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.bgImage} alt="" loading="lazy" />
            </div>
            <div className={styles.exploreCardGradient} />

            <DeadLink  className={styles.exploreCardLink}>
              <div className={styles.exploreCardContent}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.icon} alt="" className={styles.exploreCardIcon} loading="lazy" />
                <h3>{p.name}</h3>
                <p>{p.body}</p>
              </div>
            </DeadLink>
          </div>
        ))}
      </div>
    </section>
  );
}
