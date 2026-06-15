/**
 * @jest-environment node
 */

import { throwIfPotentialCSRFAttack } from "../../lib/actions";

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
        "`request.url` host does not match `origin` header from a forwarded action request",
      );
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
        "`request.url` host does not match `origin` header from a forwarded action request",
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
        "`request.url` host does not match `origin` header from a forwarded action request",
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
        "`request.url` host does not match `origin` header from a forwarded action request",
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
        "`request.url` host does not match `origin` header from a forwarded action request",
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
        "`request.url` host does not match `origin` header from a forwarded action request",
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
        "`request.url` host does not match `origin` header from a forwarded action request",
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
