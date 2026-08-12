import assert from "node:assert/strict";
import { getProductConfig } from "./product-options";

assert.equal(getProductConfig("Oracle Primavera P6").kind, "bundle");
assert.equal(getProductConfig("Microsoft 365 Apps").kind, "bundle");
assert.equal(getProductConfig("Microsoft Visio").kind, "bundle");
assert.equal(getProductConfig("Power BI").kind, "bundle");
assert.equal(getProductConfig("(NCE) Microsoft 365 Business Standard").kind, "bundle");
assert.equal(getProductConfig("Microsoft 365 E3").kind, "bundle");
assert.equal(
  getProductConfig("Primavera P6 Professional Project Management - Application User Perpetual")
    .kind,
  "bundle",
);
assert.equal(getProductConfig("Windows Server 2025 Standard").kind, "bundle");

// Levels / renewals still resolve.
assert.equal(getProductConfig("Adobe Acrobat Pro").kind, "levels");
assert.equal(getProductConfig("Revit").kind, "renewal");
assert.equal(getProductConfig("Revit").packages, undefined);
assert.equal(getProductConfig("3ds Max").packages, undefined);
assert.equal(getProductConfig("Navisworks").packages, undefined);
assert.equal(getProductConfig("InfoDrainage").packages, undefined);
assert.equal(getProductConfig("InfoWorks ICM").packages, undefined);

// Plain renewal defaults (duration + type + qty).
assert.equal(getProductConfig("AutoCAD").kind, "renewal");
assert.equal(getProductConfig("Civil 3D").kind, "renewal");
assert.equal(getProductConfig("AEC Collection").kind, "renewal");
assert.equal(getProductConfig("AutoCAD LT").kind, "renewal");
assert.equal(getProductConfig("Autodesk Takeoff").kind, "renewal");
assert.equal(getProductConfig("Fabrication CAMduct").kind, "renewal");
assert.equal(getProductConfig("InfraWorks").kind, "renewal");
assert.equal(getProductConfig("Inventor Professional").kind, "renewal");
assert.equal(getProductConfig("Navisworks Simulate").kind, "renewal");
assert.equal(getProductConfig("InfoWater Pro").kind, "renewal");
assert.equal(getProductConfig("InfoWorks WS Pro").kind, "renewal");

// Renewal + package tiers.
const build = getProductConfig("Autodesk Build");
assert.equal(build.kind, "renewal");
assert.ok(build.kind === "renewal" && build.packages?.some((p) => p.id === "unlimited"));
const docs = getProductConfig("Autodesk Docs");
assert.ok(docs.kind === "renewal" && docs.packages?.length === 5);
const bim = getProductConfig("BIM Collaborate Pro");
assert.ok(bim.kind === "renewal" && bim.packages?.length === 6);
assert.ok(bim.kind === "renewal" && !bim.packages?.some((p) => p.id === "50"));

console.log("product-options.check: ok");
