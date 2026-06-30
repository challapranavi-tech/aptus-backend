/** Main site navigation — synced from https://aptusinfotech.com/ (run `npm run cms:sync-nav`). */

export type SiteNavLink = {
  label: string;
  href?: string;
  children?: SiteNavLink[];
};

export const NAV_ITEMS: SiteNavLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "About Us",
    href: "/about-us",
    children: [
      {
        label: "Our Team",
        href: "/our-team",
      },
      {
        label: "Our Story",
        href: "/our-story",
      },
      {
        label: "Aptus Policy",
        href: "/aptus-policy",
      },
      {
        label: "Why Aptus Infotech",
        href: "/why-aptus-infotech",
      },
      {
        label: "Winning together",
        href: "/winning-together",
      },
      {
        label: "Aptus Infotech ISO Certifications",
        href: "/aptus-infotech-iso-certifications",
      },
      {
        label: "Career",
        href: "/career",
      },
      {
        label: "Contact Us",
        href: "/contact-us",
      },
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
          {
            label: "AutoCAD",
            href: "/autocad",
          },
          {
            label: "3ds Max",
            href: "/3ds-max",
          },
          {
            label: "Revit",
            href: "/revit",
          },
          {
            label: "Civil 3D",
            href: "/civil-3d",
          },
          {
            label: "AEC Collection",
            href: "/aec-collection",
          },
          {
            label: "AutoCAD LT",
            href: "/autocad-lt",
          },
          {
            label: "BIM Collaborate Pro",
            href: "/bim-collaborate-pro",
          },
          {
            label: "Autodesk Docs",
            href: "/autodesk-docs",
          },
          {
            label: "Autodesk Build",
            href: "/autodesk-build",
          },
          {
            label: "Autodesk Takeoff",
            href: "/autodesk-takeoff",
          },
          {
            label: "Navisworks",
            href: "/navisworks",
          },
          {
            label: "Water Infrastructure",
            children: [
              {
                label: "InfoDrainage",
                href: "/infodrainage",
              },
              {
                label: "InfoWater Pro",
                href: "/infowater-pro",
              },
              {
                label: "InfoWorks ICM",
                href: "/infoworks-icm",
              },
              {
                label: "InfoWorks WS Pro",
                href: "/infoworks-ws-pro",
              },
            ],
          },
        ],
      },
      {
        label: "Electrical Software",
        children: [
          {
            label: "ETAP",
            href: "/etap_new",
          },
        ],
      },
      {
        label: "Adobe",
        href: "/adobe",
        children: [
          {
            label: "Adobe Business & Creative Solutions",
            href: "/adobe-business-creative-solutions",
          },
          {
            label: "Adobe Acrobat Pro",
            href: "/adobe-acrobat-pro",
          },
          {
            label: "Adobe Illustrator",
            href: "/adobe-illustrator",
          },
          {
            label: "Adobe Photoshop",
            href: "/adobe-photoshop",
          },
          {
            label: "Adobe Premiere Pro",
            href: "/adobe-premiere-pro",
          },
        ],
      },
      {
        label: "Oracle",
        children: [
          {
            label: "Oracle Primavera P6",
            href: "/oracle-primavera-p6",
          },
          {
            label: "Aconex",
            href: "/aconex",
          },
        ],
      },
      {
        label: "Microsoft",
        href: "/microsoft",
        children: [
          {
            label: "Microsoft 365 Apps",
            href: "/microsoft-365-apps",
          },
          {
            label: "Microsoft 365 Business",
            href: "/microsoft-365-business",
          },
          {
            label: "Microsoft Visio",
            href: "/microsoft-visio",
          },
          {
            label: "Power BI",
            href: "/power-bi",
          },
        ],
      },
      {
        label: "Multimedia",
        href: "/multimedia-software-solutions",
        children: [
          {
            label: "Bluebeam",
            href: "/bluebeam",
          },
          {
            label: "Chaos Corona",
            href: "/chaos-corona",
          },
          {
            label: "Enscape",
            href: "/enscape",
          },
          {
            label: "Luminon",
            href: "/luminon",
          },
          {
            label: "Nitro PDF",
            href: "/nitro",
          },
          {
            label: "Sketchup",
            href: "/sketchup",
          },
          {
            label: "Twinmotion",
            href: "/twinmotion",
          },
          {
            label: "V-Ray",
            href: "/v-ray",
          },
        ],
      },
      {
        label: "Quantity Takeoff",
        children: [
          {
            label: "Autodesk Takeoff",
            href: "/autodesk-takeoff",
          },
          {
            label: "Cubicost BM QS",
            href: "/cubicost-bm-qs",
          },
          {
            label: "Planswift",
            href: "/plainswift",
          },
          {
            label: "RIB CostX",
            href: "/rib-costx",
          },
        ],
      },
      {
        label: "Structural Software",
        children: [
          {
            label: "Computers & Structures, Inc",
            href: "/computers-structures-inc",
          },
          {
            label: "Prokon",
            href: "/prokon",
          },
        ],
      },
      {
        label: "Cyber Security Solutions",
        href: "/cyber-security-solution",
        children: [
          {
            label: "Fortinet",
            href: "/fortinet",
          },
          {
            label: "Sophos",
            href: "/sophos",
          },
          {
            label: "SonicWall Next-Gen Firewall",
            href: "/sonicwall-next-gen-firewall",
          },
          {
            label: "Kaspersky",
            href: "/kaspersky",
          },
          {
            label: "Antivirus and Data Security",
            href: "/antivirus-and-data-security",
          },
          {
            label: "Palo Alto",
            href: "/palo-alto",
          },
        ],
      },
      {
        label: "Educational Software",
        children: [
          {
            label: "Adobe",
            href: "/adobe",
          },
          {
            label: "ANSYS",
            href: "/ansys",
          },
          {
            label: "IBM SPSS Software",
            href: "/ibm-spss-software",
          },
          {
            label: "Matlab",
            href: "/matlab",
          },
          {
            label: "Turnitin",
            href: "/turnitin",
          },
        ],
      },
      {
        label: "EDMS",
        children: [
          {
            label: "Autodesk Construction Cloud",
            href: "/construction-cloud",
          },
          {
            label: "Aconex",
            href: "/aconex",
          },
          {
            label: "Odoo",
            href: "/odoo",
          },
          {
            label: "SpectroNova",
            href: "/spectronova",
          },
        ],
      },
    ],
  },
  {
    label: "ELV Solutions",
    href: "/elv-solutions",
    children: [
      {
        label: "Access Control System",
        href: "/access-control-system",
      },
      {
        label: "Thermal Scanners",
        href: "/thermal-scanners",
      },
      {
        label: "Advanced Control Room Solutions",
        href: "/advanced-control-room-solutions",
      },
      {
        label: "CCTV",
        href: "/cctv-camera",
      },
      {
        label: "Gate Automation",
        href: "/gate-automation",
      },
      {
        label: "Smart Homes",
        href: "/home-automation",
      },
      {
        label: "Audio/Video Solutions",
        href: "/audio-video-solutions",
      },
      {
        label: "Network and Structured Cabling Solutions",
        href: "/network-and-structured-cabling-solutions",
      },
      {
        label: "UPS",
        href: "/ups",
      },
      {
        label: "Guest Room Management",
        href: "/guest-room-management",
      },
      {
        label: "Nurse Calling System",
        href: "/nurse-calling-system",
      },
      {
        label: "SMATV/ IPTV",
        href: "/smatv-iptv",
      },
      {
        label: "Queue Management",
        href: "/rsi-queue-management",
      },
      {
        label: "Data Center Solutions",
        href: "/data-center-solutions",
      },
      {
        label: "Switching and Routing",
        href: "/switching-and-routing",
      },
      {
        label: "Conference room solution",
        href: "/conference-room-solution",
      },
    ],
  },
  {
    label: "Aptus Case Studies",
    href: "/aptus-case-studies",
  }
];
