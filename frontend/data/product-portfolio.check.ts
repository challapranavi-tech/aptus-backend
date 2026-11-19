import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOFTWARE_FULL_CATALOG } from "./software-full-catalog.ts";
import {
  PRODUCT_PORTFOLIO,
  auditProductPortfolio,
  normalizeSearchText,
  searchCatalogProducts,
  splitSolutionTypes,
} from "./product-portfolio.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const workbook = path.resolve(here, "../../Aptus_Product_Portfolio (1).xlsx");
const fromSheet = JSON.parse(
  execFileSync(
    "python",
    [
      "-c",
      `
import json, openpyxl, sys
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
rows = []
for brand, product, solution in wb.active.iter_rows(min_row=2, values_only=True):
    if brand is None and product is None and solution is None:
        continue
    rows.append({"brand": brand, "product": product, "solution": solution})
json.dump(rows, sys.stdout)
`,
      workbook,
    ],
    { encoding: "utf8" },
  ),
) as { brand: string; product: string; solution: string }[];

assert.deepEqual(PRODUCT_PORTFOLIO, fromSheet, "portfolio JSON drifted from the workbook");

const audit = auditProductPortfolio();
assert.equal(audit.rowCount, 69);
assert.deepEqual(audit.blankRows, []);
assert.deepEqual(audit.duplicateKeys, []);
assert.equal(audit.paddedSolutionCells.length, 5);
for (const cell of audit.paddedSolutionCells) {
  assert.equal(cell.solution, " Cybersecurity");
}
assert.deepEqual(
  audit.nearDuplicateSolutions,
  [["Education", "Education Solution"]],
);
assert.equal(audit.multiSolutionRows.length, 8);

const catalog = SOFTWARE_FULL_CATALOG;
const all = searchCatalogProducts(catalog, {
  brandIds: null,
  solutionTypes: null,
  query: "",
});

for (const product of catalog.flatMap((brand) =>
  brand.products.map((item) => ({ brandId: brand.id, name: item.name })),
)) {
  assert.ok(
    all.some((hit) => hit.brandId === product.brandId && hit.productName === product.name && !hit.synthetic),
    `catalog product dropped: ${product.name}`,
  );
}

for (const row of PRODUCT_PORTFOLIO) {
  const brand = catalog.find((item) => normalizeSearchText(item.label) === normalizeSearchText(row.brand));
  assert.ok(brand, `no catalog brand for ${row.brand}`);
  const covered = all.some(
    (hit) =>
      hit.brandId === brand.id &&
      (hit.portfolioProducts.includes(row.product) || hit.productName === row.product),
  );
  assert.ok(covered, `portfolio row not searchable: ${row.brand} / ${row.product}`);
}

function names(filters: Parameters<typeof searchCatalogProducts>[1]): string[] {
  return searchCatalogProducts(catalog, filters)
    .map((hit) => `${hit.brandLabel} / ${hit.productName}`)
    .sort();
}

const engineering = names({
  brandIds: null,
  solutionTypes: ["Engineering & Construction"],
  query: "",
});
assert.ok(engineering.some((name) => name.includes("AutoCAD")));
assert.ok(engineering.some((name) => name.includes("V-Ray")));
assert.equal(engineering.some((name) => name.startsWith("Fortinet")), false);
assert.equal(engineering.some((name) => name.includes("Photoshop")), false);

const multimediaChaos = names({
  brandIds: ["chaos"],
  solutionTypes: ["Multimedia"],
  query: "",
});
assert.deepEqual(
  multimediaChaos.filter((name) => name.startsWith("Chaos")),
  ["Chaos / V-Ray"],
);

const creativeChaos = names({
  brandIds: ["chaos"],
  solutionTypes: ["Creative & Document Management"],
  query: "",
});
assert.ok(creativeChaos.includes("Chaos / Corona"));
assert.equal(creativeChaos.includes("Chaos / V-Ray"), false);

assert.deepEqual(
  names({ brandIds: null, solutionTypes: ["CCTV"], query: "" }),
  [],
);
assert.deepEqual(
  names({ brandIds: null, solutionTypes: null, query: "  norden " }),
  [],
);
assert.deepEqual(
  names({ brandIds: null, solutionTypes: null, query: "Hikvision" }),
  [],
);

const powerBi = names({ brandIds: null, solutionTypes: null, query: "  POWER   BI " });
assert.ok(powerBi.some((name) => name.includes("Power BI")));

const cyber = names({ brandIds: null, solutionTypes: null, query: "cyber" });
assert.ok(cyber.some((name) => name.startsWith("Fortinet")));
assert.equal(
  cyber.some((name) => name.startsWith("Fortinet")),
  splitSolutionTypes(" Cybersecurity").includes("Cybersecurity"),
);

const education = names({ brandIds: null, solutionTypes: ["Education"], query: "" });
assert.ok(education.some((name) => name.includes("Creative Cloud")));
assert.equal(education.some((name) => name.includes("MATLAB") || name.includes("Matlab")), false);

const educationSolution = names({
  brandIds: null,
  solutionTypes: ["Education Solution"],
  query: "",
});
assert.ok(educationSolution.some((name) => normalizeSearchText(name).includes("matlab")));
assert.equal(educationSolution.some((name) => name.includes("Photoshop")), false);

console.log("product-portfolio.check: ok");
