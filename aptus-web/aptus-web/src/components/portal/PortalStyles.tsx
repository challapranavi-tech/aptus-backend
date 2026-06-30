import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/aptus.css";
import "@/styles/customer-dashboard.css";
/* After Bootstrap so masthead layout is not overridden on portal pages */
import "@/styles/site-header.css";

/** Loads Odoo demo portal styles (aptus-main preview). */
export function PortalStyles() {
  return null;
}
