"use client";

import Link from "next/link";
import {
  KNOWLEDGE_HUB_FEATURED,
  KNOWLEDGE_HUB_INSIGHT,
  KNOWLEDGE_HUB_LINKS,
  KNOWLEDGE_HUB_NEWS,
} from "@/data/knowledge-hub-nav";

function MegaArrow() {
  return (
    <svg className="aptus-knowledge-mega__arrow" viewBox="0 0 8 12" aria-hidden>
      <path fill="currentColor" d="M1.2 0 0 1.2 5.6 6 0 10.8 1.2 12 8 6 1.2 0Z" />
    </svg>
  );
}

function renderFeaturedTitle(title: string) {
  const parts = title.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={`${part}-${index}`}>{part}</strong>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

interface KnowledgeHubMegaMenuProps {
  onNavigate?: () => void;
}

export function KnowledgeHubMegaMenu({ onNavigate }: KnowledgeHubMegaMenuProps) {
  return (
    <div className="aptus-knowledge-mega">
      <nav className="aptus-knowledge-mega__nav" aria-label="Knowledge Hub">
        <ul className="aptus-knowledge-mega__links">
          {KNOWLEDGE_HUB_LINKS.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="aptus-knowledge-mega__link" onClick={onNavigate}>
                <MegaArrow />
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="aptus-knowledge-mega__divider" aria-hidden />

      <Link
        href={KNOWLEDGE_HUB_FEATURED.href}
        className="aptus-knowledge-mega__featured"
        onClick={onNavigate}
      >
        <span className="aptus-knowledge-mega__tag">{KNOWLEDGE_HUB_FEATURED.tag}</span>
        <p className="aptus-knowledge-mega__featured-title">
          {renderFeaturedTitle(KNOWLEDGE_HUB_FEATURED.title)}
        </p>
        <p className="aptus-knowledge-mega__metric">
          <span className="aptus-knowledge-mega__metric-value">{KNOWLEDGE_HUB_FEATURED.metric}</span>
          <span className="aptus-knowledge-mega__metric-label">
            {KNOWLEDGE_HUB_FEATURED.metricLabel}
          </span>
        </p>
      </Link>

      <div className="aptus-knowledge-mega__aside">
        <Link
          href={KNOWLEDGE_HUB_NEWS.href}
          className="aptus-knowledge-mega__card"
          onClick={onNavigate}
        >
          <span className="aptus-knowledge-mega__card-label">{KNOWLEDGE_HUB_NEWS.title}</span>
          <div className="aptus-knowledge-mega__thumb aptus-knowledge-mega__thumb--news" aria-hidden />
          <p className="aptus-knowledge-mega__card-text">{KNOWLEDGE_HUB_NEWS.headline}</p>
        </Link>

        <Link
          href={KNOWLEDGE_HUB_INSIGHT.href}
          className="aptus-knowledge-mega__card"
          onClick={onNavigate}
        >
          <span className="aptus-knowledge-mega__card-label">{KNOWLEDGE_HUB_INSIGHT.title}</span>
          <div className="aptus-knowledge-mega__thumb aptus-knowledge-mega__thumb--insight" aria-hidden />
          <p className="aptus-knowledge-mega__card-text">{KNOWLEDGE_HUB_INSIGHT.headline}</p>
        </Link>
      </div>
    </div>
  );
}
