/**
 * Crop client logos from clean PDF page exports and rebuild all key projects.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const assetsDir =
  "C:/Users/123/.cursor/projects/c-Users-123-Downloads-aptus-react-main/assets";
const outDir = path.join(root, "frontend/public/images/key-projects");
const caseStudiesPath = path.join(
  root,
  "backend/content/odoo-json/case-studies/aptus-case-studies.json",
);
const frontendCaseStudiesPath = path.join(root, "frontend/content/case-studies.json");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 56);
}

function pageFile(n) {
  const files = fs.readdirSync(assetsDir).filter((f) =>
    f.includes(`ilovepdf_merged_page-${String(n).padStart(4, "0")}`),
  );
  if (!files.length) throw new Error(`Missing page ${n}`);
  return path.join(assetsDir, files[0]);
}

/**
 * Even logo-row crops for clean PDF pages (695x1024).
 * logoLeft/logoSize/top/bottom are fractions of width/height.
 */
function logoBoxes(count, opts = {}) {
  const {
    logoLeft = 0.07,
    logoSize = 0.17,
    top = 0.115,
    bottom = 0.945,
  } = opts;
  const W = 695;
  const H = 1024;
  const left = Math.round(W * logoLeft);
  const size = Math.round(W * logoSize);
  const bandTop = Math.round(H * top);
  const bandBottom = Math.round(H * bottom);
  const rowH = (bandBottom - bandTop) / count;

  return Array.from({ length: count }, (_, i) => {
    const rowTop = bandTop + i * rowH;
    const topPx = Math.round(rowTop + (rowH - size) / 2);
    return {
      left,
      top: Math.max(0, topPx),
      width: size,
      height: size,
    };
  });
}

const PAGES = [
  {
    page: 1,
    boxes: logoBoxes(6, { top: 0.115, bottom: 0.945 }),
    projects: [
      ["Fisheries Development Oman", "Fiber to the Office (FTTO) for the Tuna & Sardines Canning Complex", "We developed sustainable commercial aquaculture and fishing sector in Oman through a joint commitment between Ministry of Agriculture and Fisheries Wealth and Oman Investment Authority (OIA). We provided end-to-end state of the art ELV solutions using fiber to office (FTTO) technology."],
      ["The Sultan's School", "IP CCTV Systems for Safety, Security & Control of Sultan School", "We successfully completed ELV Solutions for their Hostel building, Mosque, Cafeteria, Auditorium, Store and Library, which included structured cabling, Wi-Fi and PA Systems."],
      ["Petroleum Development Oman", "Networking | SMATV & CCTV | Telephone System", "Healthcare premises pose unique challenges to ensure security due to people under mental stress, high value equipment and sensitivity of medical data. A complete ELV system was designed and implemented for the Rehabilitation center in Amirat, Muscat, initiated by the Ministry of Health."],
      ["Diwan of Royal Court", "Audio Visual & Security Systems", "We offered the most comprehensive product portfolio of ELV and security solutions. Our team experts provided design, integration and implementation services to the Camel and horse racing building in Adam and Sports complex in Mawellah."],
      ["OQ", "Design, Engineering, Installation & Commissioning", "We delivered ELV Solutions for their staff accommodation building of 300 studio apartments, 36 two-bedroom apartments, 20 villas and facility buildings in Duqm."],
      ["Haima Services Trading & Contracting Company", "PA & AV, Digital Signage, Telephony, Security & Guest Management System", "We executed ELV Solutions for two Duqm Express Hotels of Haima Services Trading & Contracting Company."],
    ],
  },
  {
    page: 2,
    boxes: logoBoxes(5, { top: 0.12, bottom: 0.94 }),
    projects: [
      ["Nama", "Video Diagnosis, Video Intelligent Analysis, Access Control Technology", "We provided complete ELV Solutions for their contractor China Geo for the reinforcement of NAMA Al-Sharqiya water transmission project. We completed end-to-end ELV solutions for their main contractor SEDE, providing water transmission system from Sohar to Ad-Dhahirah governorate connecting all seven locations."],
      ["Royal Court Affairs", "Trespass Detection & Security Systems", "We implemented ELV project for Mirani Fort & Rest area for Baith Al-Barkha Palace."],
      ["Galfar", "Multi-functional Systems & Increased Security", "For sustainable city Yiti, we deployed FTTH, Audio/Video Door Phones | PA Systems | Structured Cabling for their 19 Commercial, Residential and Office buildings."],
      ["University of Technology and Applied Sciences", "Promoted academic integrity by deterring plagiarism to improve student outcomes", "UTAS implemented Turnitin plagiarism detection program with 40,000 licenses for their branches of the university to protect and promote academic integrity."],
      ["Ministry of Housing", "Civil engineering design and documentation software supporting BIM workflows", "In lieu of Oman’s Vision 2040, MOH implemented Autodesk Civil 3D and AutoCAD including specialized toolsets version 2022 — 200 seats of Civil 3D and 50 seats of AutoCAD with training and 3 years maintenance and support."],
    ],
  },
  {
    page: 3,
    boxes: logoBoxes(3, { top: 0.135, bottom: 0.78, logoSize: 0.175, logoLeft: 0.075 }),
    projects: [
      ["Yiti", "Software for Advanced Technology, Builders Network and Predictive Insights", "One of our key projects of building luxury hotels, villas and other amenities in Yiti for about 3 years. We provided Autodesk Construction Cloud for SSH and Dawood Contracting — document management, project management, safety management, and site drawing coordination."],
      ["OPAZ", "BIM & CAD Software, including Revit, Civil 3D & AutoCAD, and a cloud-based common data environment", "Public Authority for Special Economic Zones & Free Zones (OPAZ) needed end-to-end capabilities for design, engineering, and construction. Our team implemented Autodesk AEC Collection for Infrastructure Design."],
      ["OSCO", "Autodesk Revit for intelligent 3D model with real-world information & CAD", "We provided extensive support in early clash detection and improved constructability using Revit & CAD, enabling design visualization at 30%, 60% and 90% review stages — a satisfied customer since 2015."],
    ],
  },
  {
    page: 4,
    boxes: logoBoxes(5, { top: 0.12, bottom: 0.94 }),
    projects: [
      ["Duqm Special Economic Zone (SEZAD)", "The best in class Multimedia & creativity software products — Adobe", "Adobe’s technology empowered stakeholders to imagine, create and bring digital experiences to life. Acrobat, Illustrator, Photoshop and InDesign delivered intelligent capabilities for creating, working and collaborating more efficiently."],
      ["Sohar Port and Freezone", "Autodesk AutoCAD Map3D, Raster Design & Navisworks", "We improved constructability for Sohar Port / Freezones projects and delivered precise outcomes by connecting design to construction using Autodesk AEC Collection for Infrastructure Design."],
      ["Nama Group", "Autodesk software to draw and edit digital 2D and 3D designs more quickly with better accuracy", "Implemented 75+ seats of AutoCAD for designing and drafting — enabling users to conceptualize ideas, product designs, and drawings with technical accuracy and rapid design calculations."],
      ["Galfar Engineering & Contracting", "Complete ELV Solutions", "From early phase requirements and conception to complete analysis and design: PA Systems | Building Management Systems | CCTV | Access Control | Switching | Routing | Structured Cabling | IP Telephone."],
      ["Dhofar Municipality", "Software that supports design, simulate, visualize, coordinate and manage", "We provided Autodesk AEC Collection of BIM and CAD software (Revit, Civil 3D, AutoCAD) enabling designers, engineers and contractors of Dhofar Municipality to deliver high quality projects, including Autodesk Docs dashboards and reports."],
    ],
  },
  {
    page: 5,
    boxes: logoBoxes(6, { top: 0.115, bottom: 0.945 }),
    projects: [
      ["Galfar", "Complete ELV Solution at Darsait STP", "We implemented Building Management Systems | CCTV | Access Control | Switching | Routing | Structured Cabling | IP Telephone."],
      ["Al Abraj Energy Services", "Complete ELV Systems for Al Abraj Energy Services", "We implemented Structured Cabling Network | Access Control | Time & Attendance | CCTV | Gate Barriers."],
      ["Muscat Bay", "Guest Room Management Systems & ELV Solution", "We deployed Lighting Control | Temperature Control | Auto-control Curtains | TV | Music System."],
      ["Ministry of Defense, Sultanate of Oman", "Structured Cabling Solution", "For Entrance Facilities, Equipment Room, Backbone Cabling, Telecommunications Room, Horizontal Cabling and Work Area — Musaanah Air Base Accommodation."],
      ["Al Injaz Private School", "Complete ELV Solutions for Al Injaz Private School", "Fiber To The Office (FTTO) Solution Networking | IP based PA Systems | CCTV | IP Phones."],
      ["Muscat Private Hospital", "State of the Art Data Center Solution", "We provided CCTV | Access Control | Switching | Routing & Structured Cabling | IP Telephone."],
    ],
  },
  {
    page: 6,
    boxes: logoBoxes(6, { top: 0.115, bottom: 0.945 }),
    projects: [
      ["Ministry of Health", "Design & Installation of Cabling System to Support Today’s & Future Needs", "We provided Structured Cabling | WiFi Access Points to Oman Nursing Institutes for their seven locations (Rustaq, Sur, Ibra, Ibri, Nizwa, Sohar, Salalah)."],
      ["Indian School Wadi Kabir International", "Unlocking the Future — End-to-End Fiber Network", "We successfully implemented WiFi Solutions | Data & Voice Output | Surveillance Systems | Environmental & Monitoring Systems | Access Control | Attendance at Indian School Wadi Kabir International."],
      ["Masaken Al Waha Real Estate", "Complete ELV Solutions — Masaken Al Waha Village, Sohar", "We provided Structured Cabling & Fiber Optics for nine buildings | Campus CCTV | WiFi for 5,000 users | Firewall & Server Set-up | Gate Barriers for vehicle entry & exit at Masaken Al Waha Village, Sohar."],
      ["National Bank of Oman", "Network Telephone System & Two Factor Authentication", "PABX Phone Systems | Converged Voice & Data | Multi-branches RSA Tokens."],
      ["Towell Auto Centre", "Attendance Tracking & Public Address Systems", "We executed end-to-end Structured Cabling for Data & Voice | CCTV with complete coverage | Biometric Time & Attendance | PA Systems at Towell Auto Center Warehouse — Barkha."],
      ["Oman Airports", "Barrier Against Unauthorized Access & High Security", "A true complement to security entrance lanes — supply & installation of Swing Gate Barrier at Muscat International Airport."],
    ],
  },
  {
    page: 7,
    boxes: logoBoxes(6, { top: 0.115, bottom: 0.945 }),
    projects: [
      ["Ministry of Defence — RAFO", "Proper security cabling infrastructure in order to function efficiently and effectively", "Provided Structured Cabling | IP Based PA System | CCTV at Ministry of Defence — RAFO."],
      ["Orpic / OQ", "Leveraging Latest Technology for Efficiency", "AV Video Set-up | Telephony Systems | Wireless & TCP/IP Connectivity | WiFi & Firewall | CCTV at Fahud–Sohar Pipeline Project — OQ."],
      ["Khazzan (BP)", "End-to-End ELV Solutions", "Khazzan projects included Data Network | CCTV | Access Control | Fire Alarm Systems | PA Systems | AV Solutions | Intrusion Detection Systems."],
      ["Ministry of Health Sultanate of Oman", "CCTV | Structured Cabling | Telephone System", "We implemented MOH HQ | Blood Bank — Bausher | Special Nursing Institute — Wattayah | Emergency Area — Ibri Hospital | Medical Store — Darsait | Barka Polyclinic | Pharmacy Building | Adam Hospital | Ibri Hospital | Sohar Hospital | Muscat Private Hospital | Sumail Hospital."],
      ["Sohar University", "Steering Students into Authorized and Secure Areas", "Executed Swing Gate Access Control — Main Entrance & Hostel for Sohar University."],
      ["Oman Medical College / National University", "Security Infrastructure Leveraging Latest Technology", "We installed Video Broadcasting | Digital Signage | Server & Network Security | PA Systems | Video Wall | Virtual Desktop Access at Skill Laboratory for Sohar Medical College, National University."],
    ],
  },
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const file of fs.readdirSync(outDir)) {
    if (/^\d{2}-/.test(file)) fs.unlinkSync(path.join(outDir, file));
  }

  const items = [];

  for (const page of PAGES) {
    const src = pageFile(page.page);
    for (let i = 0; i < page.projects.length; i += 1) {
      const [client, title, description] = page.projects[i];
      const box = page.boxes[i];
      const index = items.length + 1;
      const base = `${String(index).padStart(2, "0")}-${slugify(`${client}-${title}`)}.png`;
      const dest = path.join(outDir, base);

      await sharp(src)
        .extract(box)
        .png()
        .toFile(dest);

      items.push({
        title: `${client} — ${title}`,
        description,
        imageSrc: `/images/key-projects/${base}`,
        imageAlt: `${client} logo`,
      });
    }
    console.log(`Page ${page.page}: ${page.projects.length} logos`);
  }

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
  console.log(`Updated keyProjects: ${items.length} projects with clean logos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
