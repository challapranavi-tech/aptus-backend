import { SocialIcon } from "@/components/SocialIcon";
import { getSiteConfig } from "@/data";
import { HeaderAuthActions } from "./HeaderAuthActions";
import { MastheadBrand } from "./MastheadBrand";
import { NavMenu } from "./NavMenu";

export async function Header() {
  const siteConfig = await getSiteConfig();

  return (
    <header className="aptus-masthead">
      {siteConfig.topBar && (
        <div className="aptus-masthead__topbar">
          <div className="aptus-masthead__topbar-inner">
            {siteConfig.topBar.phone && (
              <div className="aptus-masthead__topbar-cell aptus-masthead__topbar-cell--contact">
                <a href={`tel:${siteConfig.topBar.phone.replace(/\s/g, "")}`}>
                  <strong>Contact: </strong>
                  {siteConfig.topBar.phone}
                </a>
              </div>
            )}
            {siteConfig.topBar.email && (
              <div className="aptus-masthead__topbar-cell aptus-masthead__topbar-cell--email">
                <a href={`mailto:${siteConfig.topBar.email}`}>
                  <b>Email:</b> {siteConfig.topBar.email}
                </a>
              </div>
            )}
            <div className="aptus-masthead__topbar-cell aptus-masthead__topbar-cell--follow">
              <b>Follow Us</b>
            </div>
            {siteConfig.topBar.socialLinks && siteConfig.topBar.socialLinks.length > 0 && (
              <div className="aptus-masthead__topbar-cell aptus-masthead__topbar-cell--social">
                <div className="aptus-masthead__social">
                  {siteConfig.topBar.socialLinks.map((social) => (
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
          </div>
        </div>
      )}

      <div className="aptus-masthead__nav">
        <div className="aptus-masthead__nav-inner">
          <MastheadBrand name={siteConfig.name} logo={siteConfig.logo ?? null} />
          <NavMenu items={siteConfig.navigation} />
          <div className="aptus-masthead__auth">
            <HeaderAuthActions />
          </div>
        </div>
      </div>
    </header>
  );
}
