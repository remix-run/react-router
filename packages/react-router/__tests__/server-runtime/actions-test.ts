/**
 * @jest-environment node
 */

import {
  throwIfPotentialCSRFAttack,
  validateActionOrigin,
} from "../../lib/actions";

describe("throwIfPotentialCSRFAttack", () => {
  describe("when origin matches host", () => {
    it("should not throw when origin matches request URL host", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://example.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, undefined),
      ).not.toThrow();
    });

    it("should ignore x-forwarded-host headers", () => {
      let request = new Request("https://different.com/action", {
        method: "POST",
        headers: {
          origin: "https://different.com",
          "x-forwarded-host": "example.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, undefined),
      ).not.toThrow();
    });
  });

  describe("when origin does not match host", () => {
    it("should throw when origin does not match request URL host", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://untrusted.com",
        },
      });
      expect(() => throwIfPotentialCSRFAttack(request, undefined)).toThrow(
        "`request.url` origin does not match `origin` header from a forwarded action request",
      );
    });

    it("should compare complete origins", () => {
      for (let [origin, requestUrl] of [
        ["http://example.com", "https://example.com/action"],
        ["https://example.com", "http://example.com/action"],
      ]) {
        let request = new Request(requestUrl, {
          method: "POST",
          headers: { origin },
        });

        expect(() => throwIfPotentialCSRFAttack(request, undefined)).toThrow();
      }
    });
  });

  describe("with allowed origins", () => {
    it("should not throw when origin matches an allowed origin exactly", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://trusted.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, ["trusted.com"]),
      ).not.toThrow();
    });

    it("should support explicitly allowed hosts", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "http://example.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, ["example.com"]),
      ).not.toThrow();
    });

    it("should not throw when origin matches a wildcard pattern", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://sub.trusted.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, ["*.trusted.com"]),
      ).not.toThrow();
    });

    it("should not throw when origin matches a multi-level wildcard pattern", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://sub.domain.trusted.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, ["**.trusted.com"]),
      ).not.toThrow();
    });

    it("should throw when origin does not match any allowed origin", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://untrusted.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, ["trusted.com", "*.safe.com"]),
      ).toThrow(
        "`request.url` origin does not match `origin` header from a forwarded action request",
      );
    });

    it("should handle multiple allowed origins", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://partner2.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, [
          "partner1.com",
          "partner2.com",
          "*.trusted.com",
        ]),
      ).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should not throw when origin is not present", () => {
      expect(() =>
        throwIfPotentialCSRFAttack(
          new Request("https://example.com/action", {
            method: "POST",
          }),
          undefined,
        ),
      ).not.toThrow();
    });

    it("should throw when origin is null string", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "null",
        },
      });
      expect(() => throwIfPotentialCSRFAttack(request, undefined)).toThrow(
        "`request.url` origin does not match `origin` header from a forwarded action request",
      );
    });

    it("should throw when origin is not a valid URL", () => {
      let invalidHeaders = [
        "not-a-valid-url",
        "ht!tp://example.com",
        "http://exam ple.com",
        "example.com",
        "",
        "    ",
      ];

      for (const invalidHeader of invalidHeaders) {
        let request = new Request("https://example.com/action", {
          method: "POST",
          headers: {
            origin: invalidHeader,
          },
        });
        expect(() => throwIfPotentialCSRFAttack(request, undefined)).toThrow(
          "`origin` header is not a valid URL. Aborting the action.",
        );
      }
    });

    it("should handle origin with port number", () => {
      let request = new Request("https://example.com:8080/action", {
        method: "POST",
        headers: {
          origin: "https://example.com:8080",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, undefined),
      ).not.toThrow();
    });

    it("should throw when origin port differs from host port", () => {
      let request = new Request("https://example.com:3000/action", {
        method: "POST",
        headers: {
          origin: "https://example.com:8080",
        },
      });
      expect(() => throwIfPotentialCSRFAttack(request, undefined)).toThrow(
        "`request.url` origin does not match `origin` header from a forwarded action request",
      );
    });

    it("should ignore empty string in allowed origins", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://different.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, ["", "other.com"]),
      ).toThrow(
        "`request.url` origin does not match `origin` header from a forwarded action request",
      );
    });

    it("should not throw when origin is null string but matches request URL host", () => {
      let request = new Request("https://null/action", {
        method: "POST",
        headers: {
          origin: "null",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, undefined),
      ).not.toThrow();
    });

    it("should handle subdomain in origin vs base domain in host", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://api.example.com",
        },
      });
      expect(() => throwIfPotentialCSRFAttack(request, undefined)).toThrow(
        "`request.url` origin does not match `origin` header from a forwarded action request",
      );
    });

    it("should not throw when wildcard allows subdomain", () => {
      let request = new Request("https://main.com/action", {
        method: "POST",
        headers: {
          origin: "https://api.example.com",
        },
      });
      expect(() =>
        throwIfPotentialCSRFAttack(request, ["*.example.com"]),
      ).not.toThrow();
    });

    it("should throw on * wildcard patterns because they only match one segment", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://different.com",
        },
      });
      expect(() => throwIfPotentialCSRFAttack(request, ["*"])).toThrow(
        "`request.url` origin does not match `origin` header from a forwarded action request",
      );
    });

    it("** should match anything", () => {
      let request = new Request("https://example.com/action", {
        method: "POST",
        headers: {
          origin: "https://different.com",
        },
      });
      expect(() => throwIfPotentialCSRFAttack(request, ["**"])).not.toThrow();
    });
  });
});

describe("validateActionOrigin", () => {
  // TLS ends at a proxy, so the server sees http:// while the browser sent https://
  let proxiedRequest = () =>
    new Request("http://example.com/action", {
      method: "POST",
      headers: {
        origin: "https://example.com",
        "x-forwarded-proto": "https",
      },
    });

  it("applies the built-in check when no function is provided", async () => {
    await expect(
      validateActionOrigin(proxiedRequest(), undefined, undefined),
    ).rejects.toThrow(
      "`request.url` origin does not match `origin` header from a forwarded action request",
    );
  });

  it("allows a request the built-in check rejects when the function returns true", async () => {
    let validate = jest.fn(
      ({ request, origin }: { request: Request; origin: string | null }) =>
        `${request.headers.get("x-forwarded-proto")}:` ===
        new URL(origin!).protocol,
    );

    await expect(
      validateActionOrigin(proxiedRequest(), undefined, validate),
    ).resolves.toBeUndefined();
    expect(validate).toHaveBeenCalledWith({
      request: expect.any(Request),
      origin: "https://example.com",
      allowed: false,
    });
  });

  it("rejects a request the built-in check accepts when the function returns false", async () => {
    let request = new Request("https://example.com/action", {
      method: "POST",
      headers: { origin: "https://example.com" },
    });
    let validate = jest.fn(() => false);

    await expect(
      validateActionOrigin(request, undefined, validate),
    ).rejects.toThrow("rejected by `unstable_validateActionOrigin`");
    expect(validate).toHaveBeenCalledWith(
      expect.objectContaining({ allowed: true }),
    );
  });

  it("rejects unless the function returns exactly true", async () => {
    let validate = jest.fn(() => "yes" as unknown as boolean);

    await expect(
      validateActionOrigin(proxiedRequest(), undefined, validate),
    ).rejects.toThrow("rejected by `unstable_validateActionOrigin`");
  });

  it("awaits an async function", async () => {
    let validate = jest.fn(async () => true);

    await expect(
      validateActionOrigin(proxiedRequest(), undefined, validate),
    ).resolves.toBeUndefined();
  });

  it("rejects when the function throws", async () => {
    let validate = jest.fn(() => {
      throw new Error("lookup failed");
    });

    await expect(
      validateActionOrigin(proxiedRequest(), undefined, validate),
    ).rejects.toThrow("lookup failed");
  });

  it("passes a null origin when the header is absent", async () => {
    let request = new Request("https://example.com/action", {
      method: "POST",
    });
    let validate = jest.fn(() => true);

    await validateActionOrigin(request, undefined, validate);
    expect(validate).toHaveBeenCalledWith({
      request,
      origin: null,
      allowed: true,
    });
  });

  it("rejects a malformed origin without calling the function", async () => {
    let request = new Request("https://example.com/action", {
      method: "POST",
      headers: { origin: "not a url" },
    });
    let validate = jest.fn(() => true);

    await expect(
      validateActionOrigin(request, undefined, validate),
    ).rejects.toThrow("`origin` header is not a valid URL");
    expect(validate).not.toHaveBeenCalled();
  });
});
