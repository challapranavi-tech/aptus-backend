import { expect, test, type Page } from "@playwright/test";

function pdfBuffer(): Buffer {
  const buf = Buffer.alloc(512, 0);
  buf.write("%PDF-1.4", 0, "ascii");
  return buf;
}

function jpegBuffer(): Buffer {
  const buf = Buffer.alloc(512, 0);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  return buf;
}

async function uploadLabeled(page: Page, label: RegExp | string, file: {
  name: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const field = page.locator(".aptus-field").filter({ hasText: label });
  await field.locator('input[type="file"]').setInputFiles(file);
}

test("careers wizard: resume hints → submit → success", async ({ page }) => {
  await page.goto("/careers/e2e-engineer/apply");
  await expect(
    page.getByRole("heading", { name: /Apply for E2E Engineer/i }),
  ).toBeVisible();

  // Step 1 — resume auto-fill + remaining basics
  await uploadLabeled(page, /Resume/i, {
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer(),
  });
  await expect(page.getByText(/pre-filled some fields|Couldn't auto-read/i)).toBeVisible({
    timeout: 20_000,
  });

  // Hints should populate these; fill any gaps.
  await page.locator("#firstName").fill("Ada");
  await page.locator("#lastName").fill("Lovelace");
  await page.locator("#email").fill("ada.lovelace@example.com");
  await page.locator("#phone").fill("91234567");
  await page.locator("#currentLocation").fill("Muscat, Oman");
  await page.locator("#dateOfBirth").fill("01-01-1995");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 — experience
  await expect(
    page.getByRole("heading", { name: "Professional Experience" }),
  ).toBeVisible();
  await page.getByLabel("Organization Name").fill("Analytical Engines");
  await page.getByLabel("Designation / Role").fill("Engineer");
  await page.getByLabel("Duration").fill("2020-2024");
  // Org field id is dynamic (`org_<id>-totalYears`); avoid clashing with
  // "Total Years of Experience".
  await page.locator('input[id$="-totalYears"]').fill("4");
  await page.locator("#edu-name-0").fill("B.Tech");
  await page.locator("#edu-inst-0").fill("SQU");
  await page.locator("#edu-year-0").fill("2017");
  await uploadLabeled(page, /Supporting document/, {
    name: "degree.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer(),
  });
  await page.locator("#reportsTo").fill("CTO");
  await page.locator("#teamSize").fill("5");
  await page.locator("#totalYearsExperience").fill("5");
  await page.locator("#currentCtc").fill("1000");
  await page.locator("#expectedCtc").fill("1200");
  await page.locator("#passportNumber").fill("A12345678");
  await page.locator("#passportValidity").fill("01-01-2035");
  await page.locator("#noticePeriod").selectOption("30 days");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3 — documents
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  await uploadLabeled(page, /Passport Copy/, {
    name: "passport.pdf",
    mimeType: "application/pdf",
    buffer: pdfBuffer(),
  });
  await uploadLabeled(page, /Passport-size Photograph/, {
    name: "photo.jpg",
    mimeType: "image/jpeg",
    buffer: jpegBuffer(),
  });
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4 — review + submit
  await expect(page.getByRole("button", { name: "Submit Application" })).toBeVisible();
  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect(
    page.getByRole("heading", { name: "Application submitted!" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/ada\.lovelace@example\.com/i)).toBeVisible();
});
