import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/customer-dashboard.css";
import "@/styles/components/side-link-nav.css";

/**
 * Portal-only CSS (Bootstrap grid/forms + customer dashboard).
 * Site tokens + masthead already load via app/layout globals.
 * Missing from the module zip: aptus.css / site-header.css — Aptus already ships those.
 */
export function PortalStyles() {
  return null;
}
