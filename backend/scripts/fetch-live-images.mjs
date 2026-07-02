#!/usr/bin/env node
/** Fetch live page HTML and list wp-content image URLs */
const slug = process.argv[2] || "aec-collection";
const r = await fetch(`https://aptusinfotech.com/${slug}/`);
const html = await r.text();
const imgs = [...new Set([...html.matchAll(/https:\/\/aptusinfotech\.com\/wp-content\/uploads\/[^"'\s>]+\.(?:png|jpe?g|webp)/gi)].map((m) => m[0]))];
console.log(imgs.join("\n"));
