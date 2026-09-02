/**
 * Import "Our Key Projects" from Aptus profile PDF into Customer Stories CMS JSON.
 * Prerequisite: docx-tmp/aptus-profile-2026.txt and docx-tmp/profile-images/
 *
 * Usage: node frontend/scripts/build-key-projects-from-profile.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const imageSrcDir = path.join(root, "docx-tmp/profile-images");
const imageDestDir = path.join(root, "frontend/public/images/key-projects");
const caseStudiesPath = path.join(
  root,
  "backend/content/odoo-json/case-studies/aptus-case-studies.json",
);

/** Curated from docx-tmp/aptus-profile-2026.txt (Aptus profile 2026 PDF, pages 9–15). */
const KEY_PROJECTS = [
  {
    title: "Ministry of Health — Rehabilitation Center, Amirat",
    description:
      "Networking, SMATV, CCTV, and telephone systems for a Ministry of Health rehabilitation center in Amirat, Muscat — a complete ELV design addressing healthcare security, medical data sensitivity, and high-value equipment protection.",
    image: "page9-img0.img_p8_1",
  },
  {
    title: "Audio Visual & Security Systems — Adam & Mawellah",
    description:
      "Comprehensive ELV and security solutions with design, integration, and implementation for the camel and horse racing building in Adam and the sports complex in Mawellah.",
    image: "page9-img9.img_p8_48",
  },
  {
    title: "Duqm Express Hotels — Haima Services",
    description:
      "PA, AV, digital signage, telephony, security, and guest management systems for two Duqm Express Hotels delivered for Haima Services Trading & Contracting Company.",
    image: "page9-img14.img_p8_67",
  },
  {
    title: "Duqm Staff Accommodation",
    description:
      "Design, engineering, installation, and commissioning of ELV solutions for a staff accommodation campus with 300 studio apartments, 36 two-bedroom apartments, 20 villas, and facility buildings in Duqm.",
    image: "page9-img16.img_p8_71",
  },
  {
    title: "Tuna & Sardines Canning Complex — FTTO",
    description:
      "End-to-end ELV solutions using Fiber to the Office (FTTO) for a sustainable aquaculture and fishing project backed by the Ministry of Agriculture and Fisheries Wealth and Oman Investment Authority.",
    image: "page10-img4.img_p9_10",
  },
  {
    title: "Sultan School — IP CCTV & ELV",
    description:
      "ELV solutions for the hostel, mosque, cafeteria, auditorium, store, and library — including structured cabling, Wi-Fi, and PA systems for safety, security, and control.",
    image: "page10-img5.img_p9_11",
  },
  {
    title: "Mirani Fort & Baith Al-Barkha Palace",
    description:
      "Trespass detection and security systems for Mirani Fort and the rest area at Baith Al-Barkha Palace.",
    image: "page10-img6.img_p9_12",
  },
  {
    title: "Ministry of Health — Autodesk Civil 3D & AutoCAD",
    description:
      "200 seats of Autodesk Civil 3D 2022 and 50 seats of AutoCAD with specialized toolsets, training, and three years of maintenance and support aligned with Oman Vision 2040.",
    image: "page10-img7.img_p9_13",
  },
  {
    title: "Yiti Sustainable City — FTTH & ELV",
    description:
      "FTTH, audio/video door phones, PA systems, and structured cabling across 19 commercial, residential, and office buildings in the sustainable city of Yiti.",
    image: "page10-img8.img_p9_14",
  },
  {
    title: "NAMA Al-Sharqiya Water Transmission",
    description:
      "Complete ELV solutions with video diagnosis, intelligent analysis, and access control for China Geo and SEDE — connecting seven locations from Sohar to Ad-Dhahirah governorate.",
    image: "page11-img2.img_p10_5",
  },
  {
    title: "University of Technology & Applied Sciences — Turnitin",
    description:
      "Turnitin plagiarism detection deployed across UTAS branches with 40,000 licenses to protect academic integrity and improve student outcomes.",
    image: "page11-img3.img_p10_8",
  },
  {
    title: "Yiti Luxury Development — Autodesk Construction Cloud",
    description:
      "Autodesk Construction Cloud for SSH and Dawood Contracting on a three-year luxury hotels and villas programme — document management, safety, and site coordination across stakeholders.",
    image: "page11-img5.img_p10_10",
  },
  {
    title: "Autodesk Revit — Clash Detection & CAD",
    description:
      "Revit and CAD support for early clash detection, improved constructability, and design visualization at 30%, 60%, and 90% review stages — a long-term client partnership since 2015.",
    image: "page11-img6.img_p10_11",
  },
  {
    title: "OPAZ — BIM & Common Data Environment",
    description:
      "Autodesk AEC Collection for the Public Authority for Special Economic Zones and Free Zones — end-to-end civil infrastructure design, engineering, and collaboration.",
    image: "page11-img7.img_p10_12",
  },
  {
    title: "Dhofar Municipality — Autodesk AEC Collection",
    description:
      "Autodesk AEC Collection including Revit, Civil 3D, and AutoCAD with Autodesk Docs dashboards — enabling designers, engineers, and contractors to deliver high-quality municipal projects.",
    image: "page12-img4.img_p11_5",
  },
  {
    title: "Adobe Creative Cloud for Digital Experience",
    description:
      "Acrobat, Illustrator, Photoshop, and InDesign empowering stakeholders to create standout digital content and accelerate document productivity.",
    image: "page12-img5.img_p11_6",
  },
  {
    title: "Sohar Port & Freezones — AutoCAD & Navisworks",
    description:
      "75+ AutoCAD seats plus Map3D, Raster Design, and Navisworks for Sohar port and free zone projects — improving constructability and connecting design to construction.",
    image: "page12-img6.img_p11_7",
  },
  {
    title: "Musaanah Air Base Accommodation",
    description:
      "Structured cabling for entrance facilities, equipment rooms, backbone cabling, telecommunications rooms, horizontal cabling, and work areas.",
    image: "page12-img7.img_p11_8",
  },
  {
    title: "State of the Art Data Center Solution",
    description:
      "CCTV, access control, switching, routing, structured cabling, and IP telephony for a modern data center deployment.",
    image: "page13-img1.img_p12_2",
  },
  {
    title: "Darsait STP — Complete ELV",
    description:
      "Building management systems, CCTV, access control, switching, routing, structured cabling, and IP telephony at Darsait sewage treatment plant.",
    image: "page13-img4.img_p12_5",
  },
  {
    title: "Al Injaz Private School",
    description:
      "Fiber to the Office networking, IP-based PA systems, CCTV, and IP phones for a complete school ELV rollout.",
    image: "page13-img5.img_p12_6",
  },
  {
    title: "Guest Room Management Systems",
    description:
      "Lighting control, temperature control, automated curtains, TV, and music systems integrated into guest room management.",
    image: "page13-img7.img_p12_9",
  },
  {
    title: "Al Abraj Energy Services",
    description:
      "Structured cabling, access control, time and attendance, CCTV, and gate barriers for Al Abraj Energy Services.",
    image: "page13-img8.img_p12_10",
  },
  {
    title: "Ministry of Defence — RAFO ELV",
    description:
      "Structured cabling, IP-based PA, and CCTV for Ministry of Defence facilities under the Royal Air Force of Oman.",
    image: "page13-img9.img_p12_11",
  },
  {
    title: "Towell Auto Center Warehouse — Barka",
    description:
      "Structured cabling for data and voice, CCTV with complete coverage, biometric time and attendance, and PA systems at Towell Auto Center warehouse.",
    image: "page14-img1.img_p13_6",
  },
  {
    title: "Oman Nursing Institutes — Seven Locations",
    description:
      "Structured cabling and Wi-Fi access points across Rustaq, Sur, Ibra, Ibri, Nizwa, Sohar, and Salalah nursing institute campuses.",
    image: "page14-img2.img_p13_7",
  },
  {
    title: "Muscat International Airport — Swing Gate Barrier",
    description:
      "Supply and installation of swing gate barriers as a high-security complement to entrance lanes at Muscat International Airport.",
    image: "page14-img3.img_p13_8",
  },
  {
    title: "Indian School Wadi Kabir International",
    description:
      "Wi-Fi, data and voice, surveillance, environmental monitoring, access control, and attendance systems for Indian School Wadi Kabir International.",
    image: "page14-img4.img_p13_12",
  },
  {
    title: "Masaken Al Waha Village — Sohar",
    description:
      "Structured cabling and fiber across nine buildings, campus CCTV, Wi-Fi for 5,000 users, firewall and server setup, and vehicle gate barriers.",
    image: "page14-img5.img_p13_13",
  },
  {
    title: "Khazzan Project — End-to-End ELV",
    description:
      "Data network, CCTV, access control, fire alarm, PA, AV, and intrusion detection for the Khazzan project.",
    image: "page15-img1.img_p14_3",
  },
  {
    title: "Ministry of Health — Multi-Site ELV",
    description:
      "CCTV, structured cabling, and telephone systems across MOH HQ, blood bank, nursing institutes, hospitals, polyclinics, and medical stores nationwide.",
    image: "page15-img2.img_p14_5",
  },
  {
    title: "Fahud–Sohar Pipeline — OQ",
    description:
      "AV video setup, telephony, wireless and TCP/IP connectivity, Wi-Fi, firewall, and CCTV for the Fahud–Sohar pipeline project.",
    image: "page15-img4.img_p14_10",
  },
  {
    title: "Sohar University — Access Control",
    description:
      "Swing gate access control at the main entrance and hostel for Sohar University.",
    image: "page15-img5.img_p14_14",
  },
  {
    title: "Sohar Medical College — Skill Laboratory",
    description:
      "Video broadcasting, digital signage, network security, PA systems, video wall, and virtual desktop access at the National University skill laboratory.",
    image: "page16-img1.img_p15_6",
  },
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function copyImage(sourceName, destBase) {
  const source = path.join(imageSrcDir, sourceName);
  if (!fs.existsSync(source)) {
    console.warn("Missing image:", sourceName);
    return undefined;
  }
  const dest = path.join(imageDestDir, `${destBase}.jpg`);
  fs.copyFileSync(source, dest);
  return `/images/key-projects/${destBase}.jpg`;
}

function main() {
  if (!fs.existsSync(imageSrcDir)) {
    console.error("Missing", imageSrcDir, "— extract images from the profile PDF first.");
    process.exit(1);
  }

  fs.mkdirSync(imageDestDir, { recursive: true });

  const items = KEY_PROJECTS.map((project, index) => {
    const base = `${String(index + 1).padStart(2, "0")}-${slugify(project.title)}`;
    const imageSrc = project.image ? copyImage(project.image, base) : undefined;
    return {
      title: project.title,
      description: project.description,
      ...(imageSrc ? { imageSrc, imageAlt: project.title } : {}),
    };
  });

  const caseStudies = JSON.parse(fs.readFileSync(caseStudiesPath, "utf8"));
  caseStudies.keyProjects = {
    id: "keyProjects",
    visible: true,
    title: { before: "Our", accent: "Key Projects" },
    items,
  };

  fs.writeFileSync(caseStudiesPath, `${JSON.stringify(caseStudies, null, 2)}\n`);
  console.log(`Updated ${caseStudiesPath} with ${items.length} key projects.`);
}

main();
