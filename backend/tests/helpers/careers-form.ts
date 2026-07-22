/** Build a valid multipart careers application FormData for route tests. */

export function pdfBytes(size = 256): Buffer {
  const buf = Buffer.alloc(size, 0);
  buf.write("%PDF-1.4", 0, "ascii");
  return buf;
}

export function jpegBytes(size = 256): Buffer {
  const buf = Buffer.alloc(size, 0);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  return buf;
}

export function exeBytes(size = 256): Buffer {
  const buf = Buffer.alloc(size, 0);
  buf[0] = 0x4d; // MZ
  buf[1] = 0x5a;
  return buf;
}

export function fileFrom(
  name: string,
  bytes: Buffer,
  type: string,
): File {
  return new File([bytes], name, { type });
}

const org = (name: string, designation: string, duration: string, years: string) =>
  JSON.stringify({ name, designation, duration, totalYears: years });

/** Minimal field set that passes parseApplicationFields + file rules. */
export function validCareersFields(overrides: Record<string, string> = {}) {
  return {
    fullName: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "+96812345678",
    applicationDate: "2026-07-13",
    appliedDesignation: "Engineer",
    candidateName: "Jane Doe",
    totalYearsExperience: "5",
    dateOfBirth: "1995-01-01",
    currentOrg: org("Acme", "Dev", "2020-2024", "4"),
    previousOrg1: org("Beta", "Jr", "2018-2020", "2"),
    previousOrg2: org(
      "Not Applicable",
      "Not Applicable",
      "Not Applicable",
      "Not Applicable",
    ),
    professionalQualification: "B.Tech",
    professionalQualificationYear: "2017",
    graduation: "B.Tech CS",
    graduationYear: "2017",
    certifications: JSON.stringify([{ name: "AWS SAA", year: "2022" }]),
    reportsTo: "CTO",
    teamSize: "5",
    currentLocation: "Muscat",
    familyDetails: "Not Applicable",
    currentCtc: "1000",
    expectedCtc: "1200",
    noticePeriod: "30 days",
    passportNumber: "A12345678",
    passportValidity: "2030-01-01",
    drivingLicense: "Not Applicable",
    educationEntries: JSON.stringify([
      { name: "B.Tech", institution: "SQU", year: "2017" },
    ]),
    position: "Engineer",
    experience: "5",
    location: "Muscat",
    jobId: "42",
    jobSlug: "engineer",
    ...overrides,
  };
}

export function buildCareersForm(options?: {
  fields?: Record<string, string>;
  resume?: File | null;
  passportCopy?: File | null;
  photograph?: File | null;
  educationDoc0?: File | null;
  extraFiles?: Array<[string, File]>;
  extraFields?: Record<string, string>;
}): FormData {
  const form = new FormData();
  const fields = validCareersFields(options?.fields);
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  if (options?.extraFields) {
    for (const [k, v] of Object.entries(options.extraFields)) form.set(k, v);
  }

  const resume =
    options?.resume === null
      ? null
      : (options?.resume ??
        fileFrom("cv.pdf", pdfBytes(), "application/pdf"));
  const passport =
    options?.passportCopy === null
      ? null
      : (options?.passportCopy ??
        fileFrom("passport.pdf", pdfBytes(), "application/pdf"));
  const photo =
    options?.photograph === null
      ? null
      : (options?.photograph ??
        fileFrom("photo.jpg", jpegBytes(), "image/jpeg"));
  const edu0 =
    options?.educationDoc0 === null
      ? null
      : (options?.educationDoc0 ??
        fileFrom("degree.pdf", pdfBytes(), "application/pdf"));

  if (resume) form.set("resume", resume);
  if (passport) form.set("passportCopy", passport);
  if (photo) form.set("photograph", photo);
  if (edu0) form.set("educationDoc_0", edu0);

  for (const [key, file] of options?.extraFiles ?? []) {
    form.append(key, file);
  }
  return form;
}

export function careersRequest(
  form: FormData,
  ip = "203.0.113.10",
): Request {
  return new Request("http://localhost:3001/api/careers/apply", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: form,
  });
}
