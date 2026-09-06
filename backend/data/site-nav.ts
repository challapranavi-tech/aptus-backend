import type { NavigationItem } from "@/types";

/** Main site navigation — synced from https://aptusinfotech.com/ (see aptus-web/scripts/generate-site-nav.mjs). */

export const SITE_NAVIGATION: NavigationItem[] = [
  {
    label: "Our Story",
    href: "/our-story",
  },
  {
    label: "About Us",
    href: "/our-team",
    children: [
      { label: "Our Team", href: "/our-team" },
      { label: "Aptus Policy", href: "/aptus-policy" },
      { label: "Why Aptus Infotech", href: "/why-aptus-infotech" },
      { label: "Winning together", href: "/winning-together" },
      { label: "Aptus Infotech ISO Certifications", href: "/aptus-infotech-iso-certifications" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact-us" },
    ],
  },
  {
    label: "Software",
    href: "/software",
    children: [
      {
        label: "Autodesk",
        href: "/autodesk",
        children: [
          { label: "AutoCAD", href: "/autocad" },
          { label: "3ds Max", href: "/3ds-max" },
          { label: "Revit", href: "/revit" },
          { label: "Civil 3D", href: "/civil-3d" },
          { label: "AEC Collection", href: "/aec-collection" },
          { label: "AutoCAD LT", href: "/autocad-lt" },
          { label: "Forma Design Collaboration", href: "/bim-collaborate-pro" },
          { label: "Autodesk Docs", href: "/autodesk-docs" },
          { label: "Autodesk Build", href: "/autodesk-build" },
          { label: "Autodesk Takeoff", href: "/autodesk-takeoff" },
          { label: "Navisworks", href: "/navisworks" },
          {
            label: "Water Infrastructure",
            children: [
              { label: "InfoDrainage", href: "/infodrainage" },
              { label: "InfoWater Pro", href: "/infowater-pro" },
              { label: "InfoWorks ICM", href: "/infoworks-icm" },
              { label: "InfoWorks WS Pro", href: "/infoworks-ws-pro" },
            ],
          },
        ],
      },
      {
        label: "Electrical Software",
        children: [{ label: "ETAP", href: "/etap" }],
      },
      {
        label: "Adobe",
        href: "/adobe",
        children: [
          { label: "Adobe Business & Creative Solutions", href: "/adobe-business-creative-solutions" },
          { label: "Adobe Acrobat Pro", href: "/adobe-acrobat-pro" },
          { label: "Adobe Illustrator", href: "/adobe-illustrator" },
          { label: "Adobe Photoshop", href: "/adobe-photoshop" },
          { label: "Adobe Premiere Pro", href: "/adobe-premiere-pro" },
        ],
      },
      {
        label: "Oracle",
        children: [
          { label: "Oracle Primavera P6", href: "/oracle-primavera-p6" },
          { label: "Aconex", href: "/aconex" },
        ],
      },
      {
        label: "Microsoft",
        href: "/microsoft",
        children: [
          { label: "Microsoft 365 Apps", href: "/microsoft-365-apps" },
          { label: "Microsoft 365 Business", href: "/microsoft-365-business" },
          { label: "Microsoft Visio", href: "/microsoft-visio" },
          { label: "Power BI", href: "/power-bi" },
        ],
      },
      {
        label: "Multimedia",
        href: "/multimedia-software-solutions",
        children: [
          { label: "Bluebeam", href: "/bluebeam" },
          { label: "Chaos Corona", href: "/chaos-corona" },
          { label: "Enscape", href: "/enscape" },
          { label: "Luminon", href: "/luminon" },
          { label: "Nitro PDF", href: "/nitro" },
          { label: "Sketchup", href: "/sketchup" },
          { label: "Twinmotion", href: "/twinmotion" },
          { label: "V-Ray", href: "/v-ray" },
        ],
      },
      {
        label: "Quantity Takeoff",
        children: [
          { label: "Cubicost BM QS", href: "/cubicost-bm-qs" },
          { label: "Planswift", href: "/plainswift" },
          { label: "RIB CostX", href: "/rib-costx" },
        ],
      },
      {
        label: "Structural Software",
        children: [
          { label: "Computers & Structures, Inc", href: "/computers-structures" },
          { label: "Prokon", href: "/prokon" },
        ],
      },
      {
        label: "Cyber Security Solutions",
        href: "/cyber-security-solution",
        children: [
          { label: "Fortinet", href: "/fortinet" },
          { label: "Sophos", href: "/sophos" },
          { label: "SonicWall Next-Gen Firewall", href: "/sonicwall-next-gen-firewall" },
          { label: "Kaspersky", href: "/kaspersky" },
          { label: "Antivirus and Data Security", href: "/antivirus-and-data-security" },
        ],
      },
      {
        label: "Educational Software",
        children: [
          { label: "Adobe", href: "/adobe" },
          { label: "ANSYS", href: "/ansys" },
          { label: "IBM SPSS Software", href: "/ibm-spss-software" },
          { label: "Matlab", href: "/matlab" },
          { label: "Turnitin", href: "/turnitin" },
        ],
      },
      {
        label: "EDMS",
        children: [
          { label: "Autodesk Construction Cloud", href: "/construction-cloud" },
          { label: "Aconex", href: "/aconex" },
          { label: "Odoo", href: "/odoo" },
          { label: "SpectroNova", href: "/spectronova" },
        ],
      },
    ],
  },
  {
    label: "ELV Solutions",
    href: "/elv-solutions",
    children: [
      { label: "Access Control System", href: "/access-control-system" },
      { label: "Thermal Scanners", href: "/thermal-scanners" },
      { label: "CCTV", href: "/cctv-camera" },
      { label: "Gate Automation", href: "/gate-automation" },
      { label: "Smart Homes", href: "/home-automation" },
      { label: "Audio/Video Solutions", href: "/audio-video-solutions" },
      { label: "Telephone Systems", href: "/telephone-systems" },
      { label: "Network and Structured Cabling Solutions", href: "/network-and-structured-cabling-solutions" },
      { label: "UPS", href: "/ups" },
      { label: "Guest Room Management", href: "/guest-room-management" },
      { label: "Nurse Calling System", href: "/nurse-calling-system" },
      { label: "SMATV/ IPTV", href: "/smatv-iptv" },
      { label: "Queue Management", href: "/rsi-queue-management" },
      { label: "Data Center Solutions", href: "/data-center-solutions" },
      { label: "Switching and Routing", href: "/switching-and-routing" },
      { label: "Conference room solution", href: "/conference-room-solution" },
    ],
  },
  {
    label: "Aptus Solar",
    href: "/aptus-solar",
  },
  { label: "Solutions in Action", href: "/customer-stories" },
];

// ponytail: self-check — live Software menu has 11 top-level categories
const software = SITE_NAVIGATION.find((item) => item.label === "Software");
if (!software?.children || software.children.length !== 11) {
  throw new Error("SITE_NAVIGATION Software menu out of sync with live site");
}
