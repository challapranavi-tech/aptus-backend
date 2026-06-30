import Image from "next/image";
import Link from "next/link";
import { SocialIcon } from "@/components/icons/SocialIcons";
import { SITE, SOCIAL } from "@/lib/constants";

const companyLinks = [
  { label: "About Us", href: "/about-us" },
  { label: "Training", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact Us", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-12 md:grid-cols-3">
        <div className="space-y-4">
          <Link href="/">
            <Image
              src="/images/Aptus-infotech-orignal-clrs-logo.png"
              alt="Aptus Infotech"
              width={200}
              height={81}
              className="h-auto w-48"
            />
          </Link>
          <p className="text-sm leading-relaxed text-gray-700">
            <b>Aptus Infotech</b> is a trusted value-added reseller in Oman with 25 years of industry
            experience. We deliver complete solutions in Structured Cabling, Data Centers, ELV
            Security, and Networking. As Gold Partners of leading ISVs like Autodesk, Adobe, and
            Oracle, we provide genuine software licenses backed by expert support.
          </p>
          <div className="flex gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-aptus-primary text-white hover:bg-aptus-green"
                aria-label={s.label}
              >
                <SocialIcon label={s.label as "Facebook" | "LinkedIn" | "WhatsApp" | "Twitter"} />
              </a>
            ))}
          </div>
        </div>

        <div className="aptus-map h-64 overflow-hidden rounded-lg">
          <iframe
            title="Aptus Infotech Muscat, Oman"
            src={SITE.mapEmbedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-4 font-semibold text-black">Company</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link href={link.href} className="hover:text-aptus-primary">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="hover:text-aptus-primary">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-black">Reach Us</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li>{SITE.phoneAlt}</li>
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-aptus-primary">
                  {SITE.email}
                </a>
              </li>
              <li>
                <a href={SITE.mapUrl} target="_blank" rel="noopener noreferrer" className="hover:text-aptus-primary">
                  {SITE.address}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
