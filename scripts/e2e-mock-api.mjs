/**
 * Tiny careers API stub for Playwright.
 * Serves job detail + parse-resume + apply on :3001 (no Odoo / Resend).
 */
import http from "node:http";

const PORT = Number(process.env.E2E_MOCK_API_PORT || 3001);
const HOST = "127.0.0.1";

const JOB = {
  id: "42",
  slug: "e2e-engineer",
  title: "E2E Engineer",
  department: "Engineering",
  location: "Muscat",
  jobType: "Full-time",
  description: "Fixture job for Playwright.",
  responsibilities: ["Ship tests"],
  requirements: ["Care about quality"],
};

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function drain(req) {
  return new Promise((resolve) => {
    req.on("data", () => {});
    req.on("end", resolve);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  cors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (
    req.method === "GET" &&
    url.pathname === "/api/careers/jobs/e2e-engineer"
  ) {
    json(res, 200, { job: JOB });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/careers/parse-resume") {
    await drain(req);
    json(res, 200, {
      hints: {
        fullName: "Ada Lovelace",
        email: "ada.lovelace@example.com",
        phone: "+968 91234567",
        autoFilledKeys: ["fullName", "email", "phone"],
      },
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/careers/apply") {
    await drain(req);
    json(res, 200, { ok: true });
    return;
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`e2e-mock-api listening on http://${HOST}:${PORT}`);
});
