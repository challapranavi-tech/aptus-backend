import { Poppins } from "next/font/google";
import "@/styles/globals.css";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { QuoteModalProvider } from "@/components/quote/QuoteModalProvider";
import { GSAPProvider } from "@/components/providers/GSAPProvider";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { Metadata, Viewport } from "next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Aptus Infotech | Trusted IT & Engineering Software Partner",
    template: "%s | Aptus Infotech",
  },
  description:
    "Aptus Infotech delivers trusted software, engineering tools, and IT solutions—from Ansys to Autodesk. Start your digital journey with us.",
  openGraph: {
    title: "Aptus Infotech | Trusted IT & Engineering Software Partner",
    description:
      "Aptus Infotech delivers trusted software, engineering tools, and IT solutions—from Ansys to Autodesk. Start your digital journey with us.",
    url: "https://aptusinfotech.com/",
    siteName: "aptusinfotech.com",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <GSAPProvider>
          <QuoteModalProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton />
          </QuoteModalProvider>
        </GSAPProvider>
      </body>
    </html>
  );
}
