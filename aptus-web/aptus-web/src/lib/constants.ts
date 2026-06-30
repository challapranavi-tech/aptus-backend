export const SITE = {
  name: "Aptus Infotech",
  title: "Aptus Infotech | Trusted IT & Engineering Software Partner",
  description:
    "Aptus Infotech delivers trusted software, engineering tools, and IT solutions—from Ansys to Autodesk. Start your digital journey with us",
  phone: "+968 24238998",
  phoneAlt: "+968 9941 8481",
  email: "info@aptusinfotech.com",
  address:
    "1st Floor, Office No 11, Building: 19 Way No: 5205, Near AlNadha Tower, Diagonally Opposite to 77 Fresh Shopping Center, Ghala Muscat Oman",
  mapUrl:
    "https://www.google.com/maps/place/Aptus+Infotech+(Oriental+Oryx+International+LLC)/@23.5866392,58.3654511,17z",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.491732804594!2d58.3654511!3d23.5866392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e8e0021b921baf7%3A0x2ee37f969610ef3e!2sAptus%20Infotech%20(Oriental%20Oryx%20International%20LLC)!5e0!3m2!1sen!2som!4v1749312000",
} as const;

export const SOCIAL = [
  { label: "Facebook", href: "https://www.facebook.com/AptusITsolutions/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/aptus-infotech-llc/posts/?feedView=all" },
  { label: "WhatsApp", href: "https://wa.me/+968%209941%208481" },
  { label: "Twitter", href: "https://x.com/aptus_infotech" },
] as const;

export { NAV_ITEMS, type SiteNavLink } from "@/lib/cms/site-nav";

export const SERVICES = [
  {
    title: "ELV Solutions",
    description:
      "We have a proficient team in supplying, installing and commissioning a range of ELV and security systems.",
    icon: "lightbulb" as const,
  },
  {
    title: "Software Related Training",
    description:
      "Mentors who are IT experts providing training that is in sync with the industry expectations.",
    icon: "cog" as const,
  },
  {
    title: "Building Information Modelling",
    description:
      "Helping clients to make the move from CAD to BIM with robust software solutions and training.",
    icon: "bim" as const,
  },
] as const;

export const KEY_ENABLERS = [
  {
    number: "01",
    title: "Differentiated Client Engagement",
    description: "Differentiated at the Front through industry and client insight",
  },
  {
    number: "02",
    title: "Deep Industy Insights",
    description: "Uncovering Key characterstics of industries and offering unique solutions",
  },
  {
    number: "03",
    title: "Standardization Of Delivery",
    description: "Delivery models targeting faster efficient and business aligned KPI's",
  },
  {
    number: "04",
    title: "Strategic Partnerships",
    description:
      "360 deg relationship; collaborative offerings, innovation with product partner and investment in next gen technologies",
  },
  {
    number: "05",
    title: "Culture",
    description: "Collaboration with customers; employees and partners",
  },
] as const;
