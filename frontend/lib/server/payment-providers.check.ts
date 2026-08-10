import assert from "node:assert/strict";
import { PaymentProviderUnavailableError, startCheckout } from "./payment-providers";

async function expectUnavailable(method: "bank_transfer" | "paypal") {
  try {
    await startCheckout({
      method,
      amount: 1000,
      currency: "omr",
      idempotencyKey: `check-${method}`,
      userId: "pa-test",
      metadata: {},
    });
    assert.fail(`expected ${method} to be unavailable`);
  } catch (error) {
    assert.ok(error instanceof PaymentProviderUnavailableError);
    assert.equal(error.method, method);
  }
}

async function main() {
  await expectUnavailable("bank_transfer");
  await expectUnavailable("paypal");
  console.log("payment-providers.check: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
