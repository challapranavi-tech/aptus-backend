import { getSiteConfig } from "@/data";
import { FooterClient } from "./FooterClient";

export async function Footer() {
  const { name, logo, footer } = await getSiteConfig();
  return <FooterClient name={name} logo={logo} footer={footer} />;
}
