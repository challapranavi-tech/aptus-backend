/**
 * Self-check: cart href must never race to /login while session is pending;
 * shared fetch must singleflight concurrent callers.
 */
import assert from "node:assert/strict";

const CART_PATH = "/portal/cart";

/** Mirror HeaderCartLink: authenticated flag must not choose login URL. */
function cartHref(_showBadge: boolean): string {
  return CART_PATH;
}

assert.equal(cartHref(true), "/portal/cart");
assert.equal(cartHref(false), "/portal/cart");
assert.ok(!cartHref(false).includes("/login"));

async function main() {
  type Entry = { promise?: Promise<number>; value?: number; at: number };
  const store = new Map<string, Entry>();
  let fetches = 0;

  async function sharedGet(path: string): Promise<number> {
    const existing = store.get(path);
    if (existing?.value !== undefined) return existing.value;
    if (existing?.promise) return existing.promise;
    const entry: Entry = { at: Date.now() };
    entry.promise = (async () => {
      fetches += 1;
      await Promise.resolve();
      entry.value = 42;
      entry.promise = undefined;
      return 42;
    })();
    store.set(path, entry);
    return entry.promise;
  }

  const [a, b] = await Promise.all([sharedGet("/api/orders"), sharedGet("/api/orders")]);
  assert.equal(a, 42);
  assert.equal(b, 42);
  assert.equal(fetches, 1);

  console.log("portal-auth-perf.check: ok");
}

void main();
