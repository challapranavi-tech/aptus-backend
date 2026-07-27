import { config } from "@fortawesome/fontawesome-svg-core";
import {
  faFacebook,
  faLinkedin,
  faWhatsapp,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;

/** Matches FA kit-style `byPrefixAndName.fab[...]` lookups for the brands we use. */
const byPrefixAndName = {
  fab: {
    facebook: faFacebook,
    linkedin: faLinkedin,
    whatsapp: faWhatsapp,
    "x-twitter": faXTwitter,
    youtube: faYoutube,
  },
} as const;

const PLATFORM_TO_ICON: Record<string, keyof typeof byPrefixAndName.fab> = {
  facebook: "facebook",
  linkedin: "linkedin",
  whatsapp: "whatsapp",
  twitter: "x-twitter",
  "x-twitter": "x-twitter",
  youtube: "youtube",
};

export function SocialIcon({
  platform,
  size = 16,
}: {
  platform: string;
  size?: number;
}) {
  const key = PLATFORM_TO_ICON[platform.toLowerCase()];
  if (!key) return null;
  return (
    <FontAwesomeIcon
      icon={byPrefixAndName.fab[key]}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
