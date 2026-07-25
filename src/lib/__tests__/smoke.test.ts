import { describe, expect, it } from "vitest";
import { signWebhookBody } from "@/lib/outbound-webhook";
import { sanitizeUserText } from "@/lib/sanitize";
import { bridgeLeadDataSchema } from "@/lib/bridge-schemas";
import {
  authStatusNoClerk,
  authStatusOk,
  authStatusMissingUser,
} from "@/lib/auth-status";
import {
  extractBearerToken,
  generateApiKeyPlaintext,
  hashApiKey,
  isApiKeyFormat,
  verifyApiKeyHash,
} from "@/lib/api-keys";
import {
  assessClerkFapiHealth,
  decodeClerkFrontendApiHost,
} from "@/lib/clerk-fapi";
import {
  normalizeSocialUrl,
  socialsForDb,
  socialsList,
} from "@/lib/business-socials";

describe("auth status payloads", () => {
  it("reports skipped prisma when clerk missing", () => {
    const body = authStatusNoClerk();
    expect(body.clerk).toBe("missing");
    expect(body.prisma).toBe("skipped");
    expect(body.prismaOk).toBe(false);
    expect(body.fapi).toBeDefined();
  });

  it("reports ok when session exists", () => {
    const body = authStatusOk({ role: "BUSINESS_OWNER", hasBusinessId: true });
    expect(body.clerk).toBe("ok");
    expect(body.prisma).toBe("ok");
    expect(body.hasBusinessId).toBe(true);
  });

  it("reports missing_user when clerk ok but no prisma user", () => {
    expect(authStatusMissingUser().prisma).toBe("missing_user");
  });
});

describe("clerk FAPI vs proxy invariant", () => {
  it("decodes custom FAPI host from publishable key", () => {
    // clerk.konnect.kmd.agency$
    const pk = "pk_live_Y2xlcmsua29ubmVjdC5rbWQuYWdlbmN5JA";
    expect(decodeClerkFrontendApiHost(pk)).toBe("clerk.konnect.kmd.agency");
  });

  it("flags mismatch when custom FAPI without proxy", () => {
    const h = assessClerkFapiHealth({
      publishableKey: "pk_live_Y2xlcmsua29ubmVjdC5rbWQuYWdlbmN5JA",
      proxyUrl: "",
    });
    expect(h.isCustomFapi).toBe(true);
    expect(h.proxyConfigured).toBe(false);
    expect(h.mismatch).toBe(true);
  });

  it("ok when custom FAPI with proxy", () => {
    const h = assessClerkFapiHealth({
      publishableKey: "pk_live_Y2xlcmsua29ubmVjdC5rbWQuYWdlbmN5JA",
      proxyUrl: "https://konnect.kmd.agency/__clerk",
    });
    expect(h.mismatch).toBe(false);
    expect(h.proxyConfigured).toBe(true);
  });

  it("flags mismatch when default FAPI with leftover proxy", () => {
    // forged: "foo.clerk.accounts.dev$"
    const host = "foo.clerk.accounts.dev$";
    const b64 = btoa(host).replace(/=+$/, "");
    const h = assessClerkFapiHealth({
      publishableKey: `pk_live_${b64}`,
      proxyUrl: "https://konnect.kmd.agency/__clerk",
    });
    expect(h.isCustomFapi).toBe(false);
    expect(h.mismatch).toBe(true);
  });
});

describe("business socials", () => {
  it("normalizes urls without protocol", () => {
    expect(normalizeSocialUrl("instagram.com/foo")).toBe(
      "https://instagram.com/foo",
    );
  });

  it("builds db payload and list", () => {
    const db = socialsForDb({
      facebook: "https://facebook.com/biz",
      instagram: "",
      tiktok: "",
      linkedin: "",
    });
    expect(db).toEqual({ facebook: "https://facebook.com/biz" });
    expect(socialsList(db!).map((s) => s.key)).toEqual(["facebook"]);
  });
});

describe("bridge lead schema (El Puente)", () => {
  it("accepts name + email", () => {
    const r = bridgeLeadDataSchema.safeParse({
      name: "María",
      email: "maria@example.com",
      phone: "",
      message: "Hola",
    });
    expect(r.success).toBe(true);
  });

  it("rejects without email and phone", () => {
    const r = bridgeLeadDataSchema.safeParse({
      name: "María",
      email: "",
      phone: "",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty name", () => {
    const r = bridgeLeadDataSchema.safeParse({
      name: "",
      email: "a@b.com",
    });
    expect(r.success).toBe(false);
  });
});

describe("webhook HMAC", () => {
  it("signs body stably", () => {
    const body = JSON.stringify({ type: "lead.created", id: "evt_1" });
    const a = signWebhookBody(body, "knwhsec_test");
    const b = signWebhookBody(body, "knwhsec_test");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(signWebhookBody(body, "other")).not.toBe(a);
  });
});

describe("sanitizeUserText", () => {
  it("strips tags and control chars", () => {
    expect(sanitizeUserText("  Hola <b>x</b>  ")).toBe("Hola x");
  });
});

describe("api keys", () => {
  it("generates kn_live_ keys that verify", () => {
    const { plaintext, hash, prefix } = generateApiKeyPlaintext();
    expect(isApiKeyFormat(plaintext)).toBe(true);
    expect(prefix.startsWith("kn_live_")).toBe(true);
    expect(verifyApiKeyHash(plaintext, hash)).toBe(true);
    expect(verifyApiKeyHash(plaintext + "x", hash)).toBe(false);
    expect(hashApiKey(plaintext)).toBe(hash);
  });

  it("parses Bearer header", () => {
    expect(extractBearerToken("Bearer kn_live_abc")).toBe("kn_live_abc");
    expect(extractBearerToken(null)).toBeNull();
  });
});
