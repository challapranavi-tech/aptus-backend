import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { writeAudit, readAuditForUser } from "./audit-log";

async function main() {
  const userId = `check-${randomUUID()}`;

  writeAudit({ action: "auth.login", actorId: userId, metadata: { n: 1 } });
  writeAudit({ action: "auth.login", actorId: userId, metadata: { n: 2 } });
  // No actorId — must not throw and must not show up under any user's log.
  writeAudit({ action: "security.rate_limited" });

  // writeAudit fires the KV write without awaiting it — give it a tick to land.
  await new Promise((resolve) => setTimeout(resolve, 50));

  const entries = await readAuditForUser(userId);
  assert.equal(entries.length, 2, "both entries for this actorId should be persisted");
  assert.equal(entries[0].metadata?.n, 2, "most recent entry first (reversed)");
  assert.equal(entries[1].metadata?.n, 1);

  const empty = await readAuditForUser(`no-such-user-${randomUUID()}`);
  assert.deepEqual(empty, []);

  console.log("audit-log.check: ok");
}

main();
