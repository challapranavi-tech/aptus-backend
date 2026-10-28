import fs from "fs";

const files = {
  acrobat: "LIVE WEBSITE/software/adobe/Buy Adobe Acrobat Pro for Teams in Oman _ Aptus Infotech.html",
  business: "LIVE WEBSITE/software/adobe/Adobe Business Creative Solution.html",
  premiere: "LIVE WEBSITE/software/adobe/Adobe Premiere Pro Subscription in Oman - Aptus Infotech.html",
  etap: "LIVE WEBSITE/software/educational software/ETAP Software for Electrical Systems in Oman _ Aptus Infotech.html",
};

function icons(chunk) {
  const r = /class="e-font-icon-svg e-(?:fas|far|fal|fab)-([\w-]+)"/g;
  const a = [];
  let m;
  while ((m = r.exec(chunk))) {
    if (!["caret-down", "eicon-menu-bar", "eicon-close"].includes(m[1])) a.push(m[1]);
  }
  return a;
}

function between(html, start, endMarkers) {
  const i = html.indexOf(start);
  if (i < 0) return null;
  let end = html.length;
  for (const em of endMarkers) {
    const j = html.indexOf(em, i + start.length);
    if (j > i && j < end) end = j;
  }
  return html.slice(i, end);
}

for (const [name, file] of Object.entries(files)) {
  const h = fs.readFileSync(file, "utf8");
  console.log(`\n=== ${name} ===`);
  for (const t of ["Powerful Features", "Powerful PDF", "Key Benefits", "Why Choose Aptus", "Why Choose Aptus Infotech", "Why Choose Adobe"]) {
    const i = h.indexOf(t);
    if (i >= 0) {
      const chunk = between(h, t, ["Ready to Transform", "What Our Clients", "Winning together"]);
      console.log(` ${t}:`, icons(chunk || "").slice(0, 10));
    }
  }
  // ETAP solutions - icons near Power System Analysis etc
  if (name === "etap") {
    const idx = h.indexOf("Power System Analysis");
    if (idx > 0) {
      const chunk = h.slice(idx - 500, idx + 8000);
      console.log(" solutions area:", icons(chunk).slice(0, 8));
    }
  }
  // business solutions titles
  if (name === "business") {
    const idx = h.indexOf("Creative Cloud for Teams");
    if (idx > 0) {
      const chunk = h.slice(idx - 500, idx + 8000);
      console.log(" solutions area:", icons(chunk).slice(0, 8));
    }
  }
}
