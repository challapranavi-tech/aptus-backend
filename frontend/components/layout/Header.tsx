import { getSiteConfig } from "@/data";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HeaderAuthActions } from "./HeaderAuthActions";
import { MastheadBrand } from "./MastheadBrand";
import { NavMenu } from "./NavMenu";

export async function Header() {
  const siteConfig = await getSiteConfig();

  return (
    <header className="aptus-masthead">
      <div className="aptus-masthead__nav">
        <div className="aptus-masthead__nav-inner">
          <MastheadBrand name={siteConfig.name} logo={siteConfig.logo ?? null} />
          <NavMenu items={siteConfig.navigation} />
          <div className="aptus-masthead__auth">
            <LanguageSwitcher className="aptus-masthead__lang" />
            <HeaderAuthActions />
          </div>
        </div>
      </div>
    </header>
  );
}
