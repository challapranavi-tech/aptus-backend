#!/usr/bin/env node
const url = process.argv[2] ?? "http://localhost:3001/etap";
const html = await fetch(url).then((r) => r.text());
const stack = html.match(/aptus-etap-stack[\s\S]*?(?=aptus-etap-body|<\/main)/)?.[0] ?? html;
const markers = [
  "Comprehensive Electrical Power System",
  "ETAP empowers electrical",
  "Power System Analysis",
  "Short-Circuit Analysis",
  "Why Choose Aptus",
];
for (const m of markers) {
  console.log(String(stack.indexOf(m)).padStart(7), m);
}
