/** Customer-facing profile — safe to import from client components (types only). */
export type ClientProfile = {
  id: string;
  portalAccountId?: string;
  email: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  phone: string;
  location: string;
  accountManager: string;
  supportTier: string;
  customerSince: string;
  billingCycle: string;
  paymentTerms: string;
  partnerId?: number;
  contactType?: ContactType;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  taxId?: string;
  website?: string;
  language?: string;
  tags?: string;
};

export type ContactType = "person" | "company";

export type UserType = "oman_company" | "outside_oman" | "individual";
