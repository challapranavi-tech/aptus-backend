import assert from "node:assert/strict";
import { profileUpdateSchema, registerSchema } from "./validation";

assert.equal(
  registerSchema.safeParse({
    userType: "oman_company",
    name: "Acme LLC",
    email: "a@example.com",
    password: "Secret1a",
  }).success,
  false,
  "company register requires CR",
);

assert.equal(
  registerSchema.safeParse({
    userType: "individual",
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "Secret1a",
  }).success,
  false,
  "individual register requires phone",
);

assert.equal(
  registerSchema.safeParse({
    userType: "oman_company",
    name: "Acme LLC",
    companyName: "Acme",
    crNumber: "1234567",
    email: "a@example.com",
    password: "Secret1a",
    phone: "+96890000000",
  }).success,
  true,
);

assert.equal(
  registerSchema.safeParse({
    userType: "individual",
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "Secret1a",
    phone: "+96890000000",
  }).success,
  true,
);

const profilePatch = profileUpdateSchema.safeParse({
  name: "Acme LLC",
  taxId: "HACKED-CR",
  phone: "+96890000000",
});
assert.equal(profilePatch.success, true, "profile update accepts name/phone");
assert.equal(
  profilePatch.success && "taxId" in profilePatch.data,
  false,
  "profile update must strip CR / taxId so it stays unique and immutable",
);

console.log("validation.architecture.check: ok");
