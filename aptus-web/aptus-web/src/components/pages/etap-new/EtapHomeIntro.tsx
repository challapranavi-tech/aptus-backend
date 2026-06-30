"use client";

import { useEtapHomeData } from "./EtapHomeDataContext";

export function EtapHomeIntro() {
  const { intro } = useEtapHomeData();

  return (
    <section className="etap-home-intro" data-gsap-section>
      <div className="etap-container" style={{ textAlign: "center" }}>
        <h1
          className="page-top-title"
          dangerouslySetInnerHTML={{ __html: intro.headlineHtml }}
        />
        <a className="subscription-button" href={intro.videoHref} target="_blank" rel="noopener noreferrer">
          <span className="video-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <polygon points="5 3 19 12 5 21 5 3" fill="white" />
            </svg>
          </span>
          &nbsp;Video: Discover ETAP
        </a>
        <div className="intro-description">
          <h4
            className="intro-description-subtitle"
            dangerouslySetInnerHTML={{ __html: intro.subtitleHtml }}
          />
          <p dangerouslySetInnerHTML={{ __html: intro.bodyHtml }} />
        </div>
      </div>
    </section>
  );
}
