import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** ISR for all marketing/CMS routes — must be a literal (Next.js static segment config). */
export const revalidate = 300;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="content" className="aptus-live">
        {children}
      </main>
      <Footer />
    </>
  );
}
