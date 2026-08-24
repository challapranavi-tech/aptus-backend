"use client";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SocialIcon } from "@/components/SocialIcon";
import { useLocale } from "@/context/LocaleProvider";
import type { SiteConfig } from "@/types";

export function HeaderTopBar({
  topBar,
}: {
  topBar: NonNullable<SiteConfig["topBar"]>;
}) {
  const { t } = useLocale();

  return (
    <div className="aptus-masthead__topbar">
      <div className="aptus-masthead__topbar-inner">
        {topBar.phone && (
          <div className="aptus-masthead__topbar-cell aptus-masthead__topbar-cell--contact">
            <a href={`tel:${topBar.phone.replace(/\s/g, "")}`}>
              <strong>{t.topBar.contact} </strong>
              {topBar.phone}
            </a>
          </div>
        )}
        {topBar.email && (
          <div className="aptus-masthead__topbar-cell aptus-masthead__topbar-cell--email">
            <a href={`mailto:${topBar.email}`}>
              <b>{t.topBar.email}</b> {topBar.email}
            </a>
          </div>
        )}
        <div className="aptus-masthead__topbar-cell aptus-masthead__topbar-cell--follow">
          <b>{t.topBar.followUs}</b>
        </div>
        {topBar.socialLinks && topBar.socialLinks.length > 0 && (
          <div className="aptus-masthead__topbar-cell aptus-masthead__topbar-cell--social">
            <div className="aptus-masthead__social">
              {topBar.socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label ?? social.platform}
                >
                  <SocialIcon platform={social.platform} size={18} />
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="aptus-masthead__topbar-cell aptus-masthead__topbar-cell--lang">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
