/**
 * Build keyProjects for Solutions in Action from docx-tmp/projects.docx.
 * Prerequisite: node frontend/scripts/extract-projects-docx.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const txtPath = path.join(root, "docx-tmp/projects.txt");
const imageSrcDir = path.join(root, "docx-tmp/projects-images");
const imageDestDir = path.join(root, "frontend/public/images/key-projects");
const caseStudiesPath = path.join(
  root,
  "backend/content/odoo-json/case-studies/aptus-case-studies.json",
);
const frontendCaseStudiesPath = path.join(root, "frontend/content/case-studies.json");

const DESCRIPTION_START =
  /^(We |For |In |A |The |Our |Provided |Executed |Implemented |Promoted |One of |Healthcare |Public Authority|Adobe|Khazzan |PABX |A true |Our skilled|From early|UTAS |Network |Attendance |Barrier |Leveraging |End-to-End |CCTV |Steering |Security|Unlocking |Complete ELV Solutions$|Complete ELV Solutions We|Ministry of Defense$|Sultanate of Oman$|Proper security|Design &|Software that|Fiber To The|Promoted academic)/i;

/** Curated titles/descriptions aligned with projects.docx content. */
const KEY_PROJECTS = [
  {
    title: "Audio Visual & Security Systems — Adam & Mawellah",
    description:
      "Comprehensive ELV and security solutions with design, integration, and implementation for the camel and horse racing building in Adam and the sports complex in Mawellah.",
  },
  {
    title: "Duqm Staff Accommodation",
    description:
      "Design, engineering, installation, and commissioning of ELV solutions for a staff accommodation campus with 300 studio apartments, 36 two-bedroom apartments, 20 villas, and facility buildings in Duqm.",
  },
  {
    title: "Duqm Express Hotels — Haima Services",
    description:
      "PA, AV, digital signage, telephony, security, and guest management systems for two Duqm Express Hotels delivered for Haima Services Trading & Contracting Company.",
  },
  {
    title: "Tuna & Sardines Canning Complex — FTTO",
    description:
      "End-to-end ELV solutions using Fiber to the Office (FTTO) for a sustainable aquaculture and fishing project backed by the Ministry of Agriculture and Fisheries Wealth and Oman Investment Authority.",
  },
  {
    title: "Sultan School — IP CCTV & ELV",
    description:
      "ELV solutions for the hostel, mosque, cafeteria, auditorium, store, and library — including structured cabling, Wi-Fi, and PA systems for safety, security, and control.",
  },
  {
    title: "Ministry of Health — Rehabilitation Center, Amirat",
    description:
      "Networking, SMATV, CCTV, and telephone systems for a Ministry of Health rehabilitation center in Amirat, Muscat — a complete ELV design addressing healthcare security and medical data sensitivity.",
  },
  {
    title: "NAMA Al-Sharqiya Water Transmission",
    description:
      "Complete ELV solutions with video diagnosis, intelligent analysis, and access control for China Geo and SEDE — connecting seven locations from Sohar to Ad-Dhahirah governorate.",
  },
  {
    title: "Mirani Fort & Baith Al-Barkha Palace",
    description:
      "Trespass detection and security systems for Mirani Fort and the rest area at Baith Al-Barkha Palace.",
  },
  {
    title: "Yiti Sustainable City — FTTH & ELV",
    description:
      "FTTH, audio/video door phones, PA systems, and structured cabling across 19 commercial, residential, and office buildings in the sustainable city of Yiti.",
  },
  {
    title: "University of Technology & Applied Sciences — Turnitin",
    description:
      "Turnitin plagiarism detection deployed across UTAS branches with 40,000 licenses to protect academic integrity and improve student outcomes.",
  },
  {
    title: "Ministry of Health — Autodesk Civil 3D & AutoCAD",
    description:
      "200 seats of Autodesk Civil 3D 2022 and 50 seats of AutoCAD with specialized toolsets, training, and three years of maintenance and support aligned with Oman Vision 2040.",
  },
  {
    title: "Yiti Luxury Development — Autodesk Construction Cloud",
    description:
      "Autodesk Construction Cloud for SSH and Dawood Contracting on a three-year luxury hotels and villas programme — document management, safety, and site coordination across stakeholders.",
  },
  {
    title: "OPAZ — BIM & Common Data Environment",
    description:
      "Autodesk AEC Collection for the Public Authority for Special Economic Zones and Free Zones — end-to-end civil infrastructure design, engineering, and collaboration.",
  },
  {
    title: "Autodesk Revit — Clash Detection & CAD",
    description:
      "Revit and CAD support for early clash detection, improved constructability, and design visualization at 30%, 60%, and 90% review stages — a long-term client partnership since 2015.",
  },
  {
    title: "Adobe Creative Cloud for Digital Experience",
    description:
      "Acrobat, Illustrator, Photoshop, and InDesign empowering stakeholders to create standout digital content and accelerate document productivity.",
  },
  {
    title: "Sohar Port & Freezones — AutoCAD & Navisworks",
    description:
      "AutoCAD Map3D, Raster Design, and Navisworks for Sohar port and free zone projects — improving constructability and connecting design to construction.",
  },
  {
    title: "AutoCAD Deployment — 75+ Seats",
    description:
      "75+ AutoCAD seats for designing and drafting with rapid design calculations and simulations across core engineering competencies.",
  },
  {
    title: "Dhofar Municipality — Autodesk AEC Collection",
    description:
      "Autodesk AEC Collection including Revit, Civil 3D, and AutoCAD with Autodesk Docs dashboards — enabling designers, engineers, and contractors to deliver high-quality municipal projects.",
  },
  {
    title: "Darsait STP — Complete ELV",
    description:
      "Building management systems, CCTV, access control, switching, routing, structured cabling, and IP telephony at Darsait sewage treatment plant.",
  },
  {
    title: "Al Abraj Energy Services",
    description:
      "Structured cabling, access control, time and attendance, CCTV, and gate barriers for Al Abraj Energy Services.",
  },
  {
    title: "Guest Room Management Systems",
    description:
      "Lighting control, temperature control, automated curtains, TV, and music systems integrated into guest room management.",
  },
  {
    title: "Musaanah Air Base Accommodation",
    description:
      "Structured cabling for entrance facilities, equipment rooms, backbone cabling, telecommunications rooms, horizontal cabling, and work areas.",
  },
  {
    title: "Al Injaz Private School",
    description:
      "Fiber to the Office networking, IP-based PA systems, CCTV, and IP phones for a complete school ELV rollout.",
  },
  {
    title: "State of the Art Data Center Solution",
    description:
      "CCTV, access control, switching, routing, structured cabling, and IP telephony for a modern data center deployment.",
  },
  {
    title: "Oman Nursing Institutes — Seven Locations",
    description:
      "Structured cabling and Wi-Fi access points across Rustaq, Sur, Ibra, Ibri, Nizwa, Sohar, and Salalah nursing institute campuses.",
  },
  {
    title: "Indian School Wadi Kabir International",
    description:
      "Wi-Fi, data and voice, surveillance, environmental monitoring, access control, and attendance systems for Indian School Wadi Kabir International.",
  },
  {
    title: "Masaken Al Waha Village — Sohar",
    description:
      "Structured cabling and fiber across nine buildings, campus CCTV, Wi-Fi for 5,000 users, firewall and server setup, and vehicle gate barriers.",
  },
  {
    title: "Towell Auto Center Warehouse — Barka",
    description:
      "Structured cabling for data and voice, CCTV with complete coverage, biometric time and attendance, and PA systems at Towell Auto Center warehouse.",
  },
  {
    title: "Muscat International Airport — Swing Gate Barrier",
    description:
      "Supply and installation of swing gate barriers as a high-security complement to entrance lanes at Muscat International Airport.",
  },
  {
    title: "Ministry of Defence — RAFO ELV",
    description:
      "Structured cabling, IP-based PA, and CCTV for Ministry of Defence facilities under the Royal Air Force of Oman.",
  },
  {
    title: "Fahud–Sohar Pipeline — OQ",
    description:
      "AV video setup, telephony, wireless and TCP/IP connectivity, Wi-Fi, firewall, and CCTV for the Fahud–Sohar pipeline project.",
  },
  {
    title: "Khazzan Project — End-to-End ELV",
    description:
      "Data network, CCTV, access control, fire alarm, PA, AV, and intrusion detection for the Khazzan project.",
  },
  {
    title: "Ministry of Health — Multi-Site ELV",
    description:
      "CCTV, structured cabling, and telephone systems across MOH HQ, blood bank, nursing institutes, hospitals, polyclinics, and medical stores nationwide.",
  },
  {
    title: "Sohar University — Access Control",
    description:
      "Swing gate access control at the main entrance and hostel for Sohar University.",
  },
  {
    title: "Sohar Medical College — Skill Laboratory",
    description:
      "Video broadcasting, digital signage, network security, PA systems, video wall, and virtual desktop access at the National University skill laboratory.",
  },
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function extFor(name) {
  return path.extname(name).slice(1).toLowerCase() || "jpg";
}

function listDocxImages() {
  if (!fs.existsSync(imageSrcDir)) return [];
  return fs
    .readdirSync(imageSrcDir)
    .filter((name) => /^image\d+\./i.test(name))
    .map((name) => ({
      name,
      num: Number(name.match(/\d+/)?.[0] ?? 0),
      full: path.join(imageSrcDir, name),
      size: fs.statSync(path.join(imageSrcDir, name)).size,
    }))
    .filter((img) => img.size >= 8000 && img.size < 400_000)
    .sort((a, b) => a.num - b.num);
}

function main() {
  if (!fs.existsSync(txtPath)) {
    console.error("Missing", txtPath, "— run extract-projects-docx.mjs first.");
    process.exit(1);
  }

  const images = listDocxImages();
  fs.mkdirSync(imageDestDir, { recursive: true });

  // Clear previous generated key-project images.
  for (const file of fs.readdirSync(imageDestDir)) {
    if (/^\d{2}-/.test(file)) fs.unlinkSync(path.join(imageDestDir, file));
  }

  const items = KEY_PROJECTS.map((project, index) => {
    const image = images[index];
    let imageSrc;
    if (image) {
      const base = `${String(index + 1).padStart(2, "0")}-${slugify(project.title)}.${extFor(image.name)}`;
      fs.copyFileSync(image.full, path.join(imageDestDir, base));
      imageSrc = `/images/key-projects/${base}`;
    }

    return {
      title: project.title,
      description: project.description,
      ...(imageSrc ? { imageSrc, imageAlt: project.title } : {}),
    };
  });

  const caseStudies = JSON.parse(fs.readFileSync(caseStudiesPath, "utf8"));
  delete caseStudies.painPoints;
  delete caseStudies.whyChoose;
  delete caseStudies.testimonials;
  delete caseStudies.partnerships;
  caseStudies.keyProjects = {
    id: "keyProjects",
    visible: true,
    title: { before: "Our", accent: "Key Projects" },
    items,
  };

  fs.writeFileSync(caseStudiesPath, `${JSON.stringify(caseStudies, null, 2)}\n`);
  fs.writeFileSync(frontendCaseStudiesPath, `${JSON.stringify(caseStudies, null, 2)}\n`);
  console.log(`Updated keyProjects (${items.length} items, ${Math.min(items.length, images.length)} images).`);
}

main();
