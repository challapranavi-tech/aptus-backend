import { getSiteConfig } from "@/data";
import { HeaderAuthActions } from "./HeaderAuthActions";
import { HeaderTopBar } from "./HeaderTopBar";
import { MastheadBrand } from "./MastheadBrand";
import { NavMenu } from "./NavMenu";

export async function Header() {
  const siteConfig = await getSiteConfig();

  return (
    <header className="aptus-masthead">
      {siteConfig.topBar ? <HeaderTopBar topBar={siteConfig.topBar} /> : null}

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
