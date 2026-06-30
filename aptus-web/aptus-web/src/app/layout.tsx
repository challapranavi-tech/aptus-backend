import type { Metadata } from "next";
import { Inter, Manrope, Poppins } from "next/font/google";
import { SITE } from "@/lib/constants";
import "./globals.css";
import "@/styles/site-header.css";
import "@/styles/adobe-pages.css";
import "@/styles/autodesk-product.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: "https://aptusinfotech.com/",
    siteName: "aptusinfotech.com",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${inter.variable} ${manrope.variable} font-poppins`}>
        {children}
      </body>
    </html>
  );
}
