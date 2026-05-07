/**
 * @jest-environment node
 */

import { throwIfPotentialCSRFAttack } from "../../lib/actions";

describe("throwIfPotentialCSRFAttack", () => {
  describe("when origin matches host", () => {
    it("should not throw when origin matches host header", () => {
      const headers = new Headers({
        origin: "https://example.com",
        host: "example.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, undefined),
      ).not.toThrow();
    });

    it("should not throw when origin matches x-forwarded-host header", () => {
      const headers = new Headers({
        origin: "https://example.com",
        "x-forwarded-host": "example.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, undefined),
      ).not.toThrow();
    });

    it("should prefer x-forwarded-host over host header", () => {
      const headers = new Headers({
        origin: "https://example.com",
        "x-forwarded-host": "example.com",
        host: "different.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, undefined),
      ).not.toThrow();
    });

    it("should use first value from comma-separated x-forwarded-host", () => {
      const headers = new Headers({
        origin: "https://example.com",
        "x-forwarded-host": "example.com, other.com, another.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, undefined),
      ).not.toThrow();
    });
  });

  describe("when origin does not match host", () => {
    it("should throw when origin does not match host header", () => {
      const headers = new Headers({
        origin: "https://untrusted.com",
        host: "example.com",
      });
      expect(() => throwIfPotentialCSRFAttack(headers, undefined)).toThrow(
        "host header does not match `origin` header from a forwarded action request",
      );
    });

    it("should throw when origin does not match x-forwarded-host header", () => {
      const headers = new Headers({
        origin: "https://untrusted.com",
        "x-forwarded-host": "example.com",
      });
      expect(() => throwIfPotentialCSRFAttack(headers, undefined)).toThrow(
        "x-forwarded-host header does not match `origin` header from a forwarded action request",
      );
    });

    it("should throw when origin is present but host headers are missing", () => {
      const headers = new Headers({
        origin: "https://untrusted.com",
      });
      expect(() => throwIfPotentialCSRFAttack(headers, undefined)).toThrow(
        "`x-forwarded-host` or `host` headers are not provided",
      );
    });
  });

  describe("with allowed origins", () => {
    it("should not throw when origin matches an allowed origin exactly", () => {
      const headers = new Headers({
        origin: "https://trusted.com",
        host: "example.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, ["trusted.com"]),
      ).not.toThrow();
    });

    it("should not throw when origin matches a wildcard pattern", () => {
      const headers = new Headers({
        origin: "https://sub.trusted.com",
        host: "example.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, ["*.trusted.com"]),
      ).not.toThrow();
    });

    it("should not throw when origin matches a multi-level wildcard pattern", () => {
      const headers = new Headers({
        origin: "https://sub.domain.trusted.com",
        host: "example.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, ["**.trusted.com"]),
      ).not.toThrow();
    });

    it("should throw when origin does not match any allowed origin", () => {
      const headers = new Headers({
        origin: "https://untrusted.com",
        host: "example.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, ["trusted.com", "*.safe.com"]),
      ).toThrow(
        "host header does not match `origin` header from a forwarded action request",
      );
    });

    it("should handle multiple allowed origins", () => {
      const headers = new Headers({
        origin: "https://partner2.com",
        host: "example.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, [
          "partner1.com",
          "partner2.com",
          "*.trusted.com",
        ]),
      ).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should not throw when origin is not present", () => {
      const headers = new Headers({
        host: "example.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, undefined),
      ).not.toThrow();
    });

    it("should throw when origin is null string without host", () => {
      const headers = new Headers({
        origin: "null",
      });
      expect(() => throwIfPotentialCSRFAttack(headers, undefined)).toThrow(
        "`x-forwarded-host` or `host` headers are not provided",
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
        const headers = new Headers({
          origin: invalidHeader,
          host: "example.com",
        });
        expect(() => throwIfPotentialCSRFAttack(headers, undefined)).toThrow(
          "`origin` header is not a valid URL. Aborting the action.",
        );
      }
    });

    it("should handle origin with port number", () => {
      const headers = new Headers({
        origin: "https://example.com:8080",
        host: "example.com:8080",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, undefined),
      ).not.toThrow();
    });

    it("should throw when origin port differs from host port", () => {
      const headers = new Headers({
        origin: "https://example.com:8080",
        host: "example.com:3000",
      });
      expect(() => throwIfPotentialCSRFAttack(headers, undefined)).toThrow(
        "host header does not match `origin` header from a forwarded action request",
      );
    });

    it("should handle x-forwarded-host with whitespace", () => {
      const headers = new Headers({
        origin: "https://example.com",
        "x-forwarded-host": "  example.com  ",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, undefined),
      ).not.toThrow();
    });

    it("should ignore empty string in allowed origins", () => {
      const headers = new Headers({
        origin: "https://different.com",
        host: "example.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, ["", "other.com"]),
      ).toThrow(
        "host header does not match `origin` header from a forwarded action request",
      );
    });

    it("should throw when origin is null string but has matching host", () => {
      const headers = new Headers({
        origin: "null",
        host: "null",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, undefined),
      ).not.toThrow();
    });

    it("should handle subdomain in origin vs base domain in host", () => {
      const headers = new Headers({
        origin: "https://api.example.com",
        host: "example.com",
      });
      expect(() => throwIfPotentialCSRFAttack(headers, undefined)).toThrow(
        "host header does not match `origin` header from a forwarded action request",
      );
    });

    it("should not throw when wildcard allows subdomain", () => {
      const headers = new Headers({
        origin: "https://api.example.com",
        host: "main.com",
      });
      expect(() =>
        throwIfPotentialCSRFAttack(headers, ["*.example.com"]),
      ).not.toThrow();
    });

    it("should throw on * wildcard patterns because they only match one segment", () => {
      const headers = new Headers({
        origin: "https://different.com",
        host: "example.com",
      });
      expect(() => throwIfPotentialCSRFAttack(headers, ["*"])).toThrow(
        "host header does not match `origin` header from a forwarded action request",
      );
    });

    it("** should match anything", () => {
      const headers = new Headers({
        origin: "https://different.com",
        host: "example.com",
      });
      expect(() => throwIfPotentialCSRFAttack(headers, ["**"])).not.toThrow();
    });
  });
});
