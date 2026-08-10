import { Suspense } from "react";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";
import { LoginStatusBanner } from "@/components/auth/LoginStatusBanner";

export const metadata = {
  title: "Customer Login | Aptus Infotech",
};

export default function LoginPage() {
  return (
    <div id="wrap" className="aptus-site aptus-customer-auth" data-aptus-auth-page="login">
      <main className="aptus-auth">
        <section className="aptus-auth__hero">
          <div className="container">
            <div className="row g-5 align-items-center justify-content-between">
              <div className="col-lg-6">
                <div className="aptus-auth__intro">
                  <h1>Secure access for Aptus customers</h1>
                  <p>
                    Sign in to manage subscriptions, renewals, purchases, and your customer profile
                    in one secure workspace.
                  </p>
                </div>
              </div>
              <div className="col-lg-5">
                <Suspense fallback={null}>
                  <LoginStatusBanner />
                </Suspense>
                <CustomerLoginForm />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
