import { jsonOk } from "@/lib/server/http";
import { SITE } from "@/lib/constants";

export async function GET() {
  return jsonOk({
    siteName: SITE.name,
    email: SITE.email,
    phone: SITE.phoneAlt,
    address: SITE.address,
    mapUrl: SITE.mapUrl,
    autodeskHubUrl: "/autodesk",
    softwareHubUrl: "/software",
  });
}
