import assert from "node:assert/strict";
import { copyForLocale, sharedArabic } from "./shared-ar.ts";

assert.equal(sharedArabic("Request a Quote"), "طلب عرض سعر");
assert.equal(
  sharedArabic(
    "25+ years in Oman, delivering smarter technology and integrated solutions that help businesses work better, operate securely and build for the future.",
  ),
  "+25 عامًا في عمان، حيث نقدم تكنولوجيا أكثر ذكاءً وحلولًا متكاملة تساعد الشركات على العمل بشكل أفضل والعمل بشكل آمن والبناء للمستقبل.",
);
assert.equal(copyForLocale("en", "IT Manager"), "IT Manager");
assert.equal(sharedArabic("Guest Room Management"), "إدارة غرف النزلاء");
assert.equal(sharedArabic("Get Your Quote Now"), "احصل على عرض السعر الآن");
assert.equal(copyForLocale("en", "Support"), "Support");
assert.equal(copyForLocale("ar", "Support"), "الدعم");
assert.equal(copyForLocale("ar", "CostX"), "CostX");
assert.equal(copyForLocale("ar", "Not a shared sentence"), "Not a shared sentence");
assert.equal(
  copyForLocale("ar", "© 2026 Aptus Infotech. All rights reserved."),
  "© 2026 Aptus Infotech. جميع الحقوق محفوظة.",
);

console.log("shared-ar.check: ok");
