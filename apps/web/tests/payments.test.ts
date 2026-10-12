import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { liqpaySign, verifyLiqpay, verifyStripeSignature } from "@/lib/payments";

describe("stripe signature", () => {
  const secret = "whsec_test";
  const payload = '{"id":"evt_1"}';
  const t = 1_800_000_000;
  const sig = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");

  it("accepts a valid signature", () => expect(verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 10)).toBe(true));
  it("rejects tampering", () => expect(verifyStripeSignature(payload + " ", `t=${t},v1=${sig}`, secret, t + 10)).toBe(false));
  it("rejects stale timestamps", () => expect(verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 1000)).toBe(false));
  it("rejects missing header", () => expect(verifyStripeSignature(payload, null, secret, t)).toBe(false));
});

describe("liqpay signature", () => {
  it("signs and verifies", () => {
    const data = Buffer.from('{"status":"success"}').toString("base64");
    const s = liqpaySign(data, "priv");
    expect(verifyLiqpay(data, s, "priv")).toBe(true);
    expect(verifyLiqpay(data, s, "other")).toBe(false);
    expect(verifyLiqpay(data + "x", s, "priv")).toBe(false);
  });
});
