'use client';

import { useState } from 'react';
import styles from "@/styles/adobe/adobe.module.css";
import { AdobeLink } from "./DeadLink";
import { ADOBE_ROUTES } from "./routes";

const TESTIMONIALS = [
  {
    quote: '"Creative Cloud lets me create effortlessly and allows me to focus on what\'s important."',
    name: 'Antoni Sendra',
    role: 'Filmmaker',
    bgDesktop: 'https://www.adobe.com/upp-shared/media_183f251f557a09b04ecf77defb4d18c59318db8c3.png?width=2000&format=webply&optimize=medium',
    bgAlt: 'Filmmaker Antoni Sendra, staring thoughtfully at his editing workstation.',
  },
  {
    quote: '"With Acrobat, I can summarize key contract details in seconds."',
    name: 'Angi Ciccarelli',
    role: 'Real Estate Agent',
    bgDesktop: 'https://www.adobe.com/upp-shared/media_18228064773606ef0c070dde4001e8c434608e42f.png?width=2000&format=webply&optimize=medium',
    bgAlt: 'Real estate agent Angi Ciccarelli, speaking interview style.',
  },
  {
    quote: '"If it wasn\'t for Creative Cloud, I don\'t think I\'d be here. I feel like I can create anything."',
    name: 'Michelle Phan',
    role: 'Creator',
    bgDesktop: 'https://www.adobe.com/upp-shared/media_13a99dc085929c3e6146364540052c4c4e4825f52.png?width=2000&format=webply&optimize=medium',
    bgAlt: 'Portrait of creator Michelle Phan in a shaggy pink sweater.',
  },
];

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const n = TESTIMONIALS.length;

  const prev = () => setActive((a) => (a - 1 + n) % n);
  const next = () => setActive((a) => (a + 1) % n);

  return (
    <section
      className={`${styles.section} ${styles.testimonialSection}`}
      aria-label="Customer testimonials"
    >
      <div className={styles.testimonialFrame}>
        <div
          className={styles.testimonialTrack}
          style={{ ['--i' as string]: active }}
        >
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className={styles.testimonialSlide}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${n}`}
              aria-hidden={i !== active}
            >
              <div className={styles.testimonialBg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.bgDesktop} alt={t.bgAlt} loading="lazy" />
              </div>
              <div className={styles.testimonialOverlay} />
              <div className={styles.testimonialContent}>
                <h3>{t.quote}</h3>
                <p className={styles.testimonialAttrib}>
                  <span className={styles.testimonialName}>{t.name}</span>
                  <span className={styles.testimonialRole}>, {t.role}</span>
                </p>
                <div>
                  <AdobeLink
                    href={ADOBE_ROUTES.business}
                    className={`${styles.btnPrimary} ${styles.btnWhite}`}
                  >
                    Explore Adobe solutions
                  </AdobeLink>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className={`${styles.testimonialArrow} ${styles.testimonialArrowPrev}`}
          onClick={prev}
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M10.8809 4.43606C10.8806 4.04471 10.5633 3.72718 10.1719 3.72707L2.4209 3.72707L4.93849 1.2095C5.21508 0.932652 5.21505 0.484406 4.93849 0.207542C4.66158 -0.0693646 4.21248 -0.0693445 3.93556 0.207542L0.208014 3.93508C-0.0689041 4.212 -0.0689047 4.66109 0.208012 4.93801L3.93555 8.66653C4.21241 8.94319 4.6616 8.94318 4.93848 8.66653C5.2153 8.38967 5.2152 7.94052 4.93848 7.6636L2.41993 5.14504L10.1719 5.14504C10.5634 5.14494 10.8809 4.82761 10.8809 4.43606Z" fill="currentColor"/>
          </svg>
        </button>

        <button
          className={`${styles.testimonialArrow} ${styles.testimonialArrowNext}`}
          onClick={next}
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M-5.23729e-06 4.43606C0.000232801 4.04471 0.317595 3.72718 0.708978 3.72707L8.45995 3.72707L5.94237 1.2095C5.66578 0.932652 5.66581 0.484406 5.94237 0.207542C6.21928 -0.0693646 6.66838 -0.0693445 6.9453 0.207542L10.6728 3.93508C10.9498 4.212 10.9498 4.66109 10.6728 4.93801L6.94531 8.66653C6.66845 8.94319 6.21925 8.94318 5.94238 8.66653C5.66556 8.38967 5.66566 7.94052 5.94238 7.6636L8.46093 5.14504L0.70898 5.14504C0.31745 5.14494 -4.81515e-06 4.82761 -5.23729e-06 4.43606Z" fill="currentColor"/>
          </svg>
        </button>

        <div className={styles.testimonialDots} role="tablist" aria-label="Slide indicators">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1}`}
              className={`${styles.testimonialDot} ${i === active ? styles.testimonialDotActive : ""}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
