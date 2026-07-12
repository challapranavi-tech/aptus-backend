import assert from "node:assert/strict";
import map from "./cms-image-map.json" with { type: "json" };

function imageStem(filename) {
  let s = filename.replace(/\.[^.]+$/, "").toLowerCase();
  s = s.replace(/_\d+$/g, "");
  s = s.replace(/-\d+x\d+/g, "");
  s = s.replace(/-e\d{8,}/g, "");
  s = s.replace(/-r[a-z0-9]{12,}/g, "");
  s = s.replace(/-\d+$/g, "");
  return s;
}

function resolveCmsImageSrc(src) {
  if (!src) return src;
  let file;
  if (src.startsWith("/images/")) {
    file = src.split("?")[0].split("/").pop();
  } else {
    try {
      const url = new URL(src);
      if (!/(^|\.)aptusinfotech\.com$/i.test(url.hostname)) return src;
      if (!url.pathname.includes("/wp-content/uploads/")) return src;
      file = decodeURIComponent(url.pathname.split("/").pop() || "");
    } catch {
      return src;
    }
  }
  if (!file) return src;
  return (
    map.exact[file.toLowerCase()] ??
    map.stem[imageStem(file)] ??
    (src.startsWith("/") ? src : `/images/${file}`)
  );
}

assert.equal(
  resolveCmsImageSrc("https://aptusinfotech.com/wp-content/uploads/2025/08/aconex.png"),
  "/images/aconex-rarqup6kbbsdrdkztai4loetxzqfmn3uierec0x17y.png",
);
assert.equal(
  resolveCmsImageSrc("/images/aconex.png"),
  "/images/aconex-rarqup6kbbsdrdkztai4loetxzqfmn3uierec0x17y.png",
);
assert.equal(
  resolveCmsImageSrc("https://cdn.example.com/x.png"),
  "https://cdn.example.com/x.png",
);

console.log("cms-image check ok");
