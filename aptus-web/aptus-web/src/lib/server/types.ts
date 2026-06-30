export type {
  ClientProfile,
  ContactType,
  UserType,
} from "@/types/profile";

import type { ContactType, UserType } from "@/types/profile";

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  companyName?: string;
  region?: string;
  crNumber?: string;
  userType?: UserType;
  contactType?: ContactType;
  phone?: string;
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

export type ProfileUpdateInput = Omit<RegisterInput, "email" | "password">;

export type SubscriptionInput = {
  productName: string;
  notes?: string;
};

export type OrderLineInput = {
  category: string;
  productName: string;
  quantity: number;
};

export type PlaceOrderInput = {
  duration: "1year" | "3year";
  items: OrderLineInput[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  paymentIntentId?: string;
  amountPaid?: number;
  paymentMethod?: string;
};
