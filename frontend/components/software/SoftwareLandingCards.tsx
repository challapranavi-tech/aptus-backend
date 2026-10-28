import type { SoftwareLandingCard } from "@/data/software-solutions-page";

function LandingIcon({ name }: { name: SoftwareLandingCard["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
          <path d="M8.5 11h5" />
        </svg>
      );
    case "license":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "cost":
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M16.5 7.5c-.8-1.3-2.2-2-4.5-2-2.8 0-4.5 1.5-4.5 3.5S9.5 12 12 12s4.5 1.2 4.5 3.5S14.8 19 12 19c-2.2 0-3.7-.8-4.5-2" />
        </svg>
      );
    case "deploy":
      return (
        <svg {...common}>
          <path d="M12 3 4 7v5c0 4.5 3.2 8.4 8 9 4.8-.6 8-4.5 8-9V7l-8-4Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "guidance":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      );
    case "manage":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" />
          <circle cx="18" cy="17" r="2.5" />
        </svg>
      );
    case "optimize":
      return (
        <svg {...common}>
          <path d="M4 19V9l5 4 4-7 7 10" />
          <path d="M15 8h5v5" />
        </svg>
      );
    case "implement":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4.5 4.5 0 0 0-6.4 6.4L4 17v3h3l4.3-4.3a4.5 4.5 0 0 0 6.4-6.4Z" />
          <path d="m15 9 2.5-2.5" />
        </svg>
      );
    default:
      return null;
  }
}

interface SoftwareLandingCardsProps {
  heading: string;
  subheading: string;
  items: SoftwareLandingCard[];
  variant: "challenges" | "solutions";
}

export function SoftwareLandingCards({
  heading,
  subheading,
  items,
  variant,
}: SoftwareLandingCardsProps) {
  const isChallenges = variant === "challenges";

  return (
    <section
      className={`aptus-software-landing-section aptus-software-landing-section--${variant}`}
      aria-labelledby={`software-${variant}-heading`}
    >
      <div className="aptus-software-landing-section__inner">
        <div className="aptus-software-landing-section__header">
          <h2 id={`software-${variant}-heading`} className="aptus-software-landing-section__heading">
            {heading}
          </h2>
          <p className="aptus-software-landing-section__subheading">{subheading}</p>
        </div>

        <div className={`aptus-software-landing-grid aptus-software-landing-grid--${variant}`}>
          {items.map((item, index) => (
            <article
              key={item.id}
              className={`aptus-software-landing-card aptus-software-landing-card--${variant}`}
            >
              <div className="aptus-software-landing-card__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageSrc} alt={item.imageAlt} loading="lazy" decoding="async" />
                <div className="aptus-software-landing-card__media-shade" aria-hidden />
                <div className="aptus-software-landing-card__icon" aria-hidden>
                  <LandingIcon name={item.icon} />
                </div>
                {isChallenges ? (
                  <p className="aptus-software-landing-card__step">0{index + 1}</p>
                ) : null}
              </div>

              <div className="aptus-software-landing-card__content">
                <h3 className="aptus-software-landing-card__title">{item.title}</h3>
                {item.description ? (
                  <p className="aptus-software-landing-card__body">{item.description}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
