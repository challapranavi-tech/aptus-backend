/** Shared snippets for About Us Odoo JSON (import from seed scripts). */
export const IMG = "https://aptusinfotech.com/wp-content/uploads/2025/05";
export const IMG07 = "https://aptusinfotech.com/wp-content/uploads/2025/07";
export const IMG10 = "https://aptusinfotech.com/wp-content/uploads/2025/10";

/** Live winning-together.xml logo order (29 partners, 5+5+5+5+5+4). */
const WINNING_ALLIANCE_LOGOS = [
  "APC", "Vertiv", "Norden", "Suprema", "Tyco",
  "FERMAX-1", "Microsens", "LS-Cables", "Logitech", "Honeywell",
  "Hikvision", "Fanvil", "FAAC", "Extron", "EATON",
  "BFT", "ZKTeco", "Yealink", "WatchNet", "URMET",
  "TOA", "Schneider", "PELCO", "Panduit", "Nice",
  "Opterna", "Axis", "Avigilon", "AKCP",
];

export function partnerships() {
  return {
    heading: "Winning together with",
    headingAccent: "Strategic Alliances",
    variant: "alliances",
    logos: WINNING_ALLIANCE_LOGOS.map((name, i) => ({
      id: `partner-${i}`,
      src: `${IMG}/${name}.png`,
      alt: name.replace(/-/g, " "),
    })),
  };
}

export function contactFormCta(overrides = {}) {
  return {
    heading: "Have questions? We can help",
    showForm: true,
    submitLabel: "Submit Now",
    layout: "light",
    ...overrides,
  };
}
