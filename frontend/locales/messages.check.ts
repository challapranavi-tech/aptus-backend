import assert from "node:assert/strict";
import { translateNavLabel } from "./messages";

assert.equal(translateNavLabel("en", "/our-story", "About Us"), "About Us");
assert.equal(translateNavLabel("ar", "/our-story", "About Us"), "من نحن");
assert.equal(translateNavLabel("ar", "/our-story", "Our Story"), "قصتنا");
assert.equal(translateNavLabel("ar", undefined, "Products and Solutions"), "المنتجات والحلول");
assert.equal(translateNavLabel("ar", undefined, "Knowledge Hub"), "مركز المعرفة");
assert.equal(translateNavLabel("ar", "/software-solutions", "Knowledge Base"), "قاعدة المعرفة");
assert.equal(translateNavLabel("ar", "/software-solutions", "Software"), "البرمجيات");
assert.equal(translateNavLabel("ar", "/autodesk", "Autodesk"), "Autodesk");
assert.equal(translateNavLabel("ar", "/careers", "Careers"), "الوظائف");

console.log("messages.check: ok");
