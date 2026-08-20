/**
 * @jest-environment node
 */

import { createCookie, isCookie } from "../../lib/server-runtime/cookies";
import { unstable_v9_createCookie } from "../../lib/server-runtime/cookies-v9";

function getCookieFromSetCookie(setCookie: string): string {
  return setCookie.split(/;\s*/)[0];
}

describe("isCookie", () => {
  it("returns `true` for Cookie objects", () => {
    expect(isCookie(createCookie("my-cookie"))).toBe(true);
  });

  it("returns `false` for non-Cookie objects", () => {
    expect(isCookie({})).toBe(false);
    expect(isCookie([])).toBe(false);
    expect(isCookie("")).toBe(false);
    expect(isCookie(true)).toBe(false);
  });
});

describe("cookies", () => {
  it("parses/serializes empty string values", async () => {
    let cookie = createCookie("my-cookie");
    let setCookie = await cookie.serialize("");
    let value = await cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toMatchInlineSnapshot(`""`);
  });

  it("parses/serializes unsigned string values", async () => {
    let cookie = createCookie("my-cookie");
    let setCookie = await cookie.serialize("hello world");
    let value = await cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toEqual("hello world");
  });

  it("parses/serializes unsigned boolean values", async () => {
    let cookie = createCookie("my-cookie");
    let setCookie = await cookie.serialize(true);
    let value = await cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toBe(true);
  });

  it("parses/serializes signed string values", async () => {
    let cookie = createCookie("my-cookie", {
      secrets: ["secret1"],
    });
    let setCookie = await cookie.serialize("hello michael");
    let value = await cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toMatchInlineSnapshot(`"hello michael"`);
  });

  it("parses/serializes string values containing utf8 characters", async () => {
    let cookie = createCookie("my-cookie");
    let setCookie = await cookie.serialize("日本語");
    let value = await cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toBe("日本語");
  });

  it("fails to parses signed string values with invalid signature", async () => {
    let cookie = createCookie("my-cookie", {
      secrets: ["secret1"],
    });
    let setCookie = await cookie.serialize("hello michael");
    let cookie2 = createCookie("my-cookie", {
      secrets: ["secret2"],
    });
    let value = await cookie2.parse(getCookieFromSetCookie(setCookie));

    expect(value).toBe(null);
  });

  it("fails to parse signed string values with invalid signature encoding", async () => {
    let cookie = createCookie("my-cookie", {
      secrets: ["secret1"],
    });
    let setCookie = await cookie.serialize("hello michael");
    let cookie2 = createCookie("my-cookie", {
      secrets: ["secret2"],
    });
    // use characters that are invalid for base64 encoding
    let value = await cookie2.parse(getCookieFromSetCookie(setCookie) + "%^&");

    expect(value).toBe(null);
  });

  it("parses/serializes signed object values", async () => {
    let cookie = createCookie("my-cookie", {
      secrets: ["secret1"],
    });
    let setCookie = await cookie.serialize({ hello: "mjackson" });
    let value = await cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toMatchInlineSnapshot(`
      {
        "hello": "mjackson",
      }
    `);
  });

  it("fails to parse signed object values with invalid signature", async () => {
    let cookie = createCookie("my-cookie", {
      secrets: ["secret1"],
    });
    let setCookie = await cookie.serialize({ hello: "mjackson" });
    let cookie2 = createCookie("my-cookie", {
      secrets: ["secret2"],
    });
    let value = await cookie2.parse(getCookieFromSetCookie(setCookie));

    expect(value).toBeNull();
  });

  it("supports secret rotation", async () => {
    let cookie = createCookie("my-cookie", {
      secrets: ["secret1"],
    });
    let setCookie = await cookie.serialize({ hello: "mjackson" });
    let value = await cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toMatchInlineSnapshot(`
      {
        "hello": "mjackson",
      }
    `);

    // A new secret enters the rotation...
    cookie = createCookie("my-cookie", {
      secrets: ["secret2", "secret1"],
    });

    // cookie should still be able to parse old cookies.
    let oldValue = await cookie.parse(getCookieFromSetCookie(setCookie));
    expect(oldValue).toMatchObject(value);

    // New Set-Cookie should be different, it uses a different secret.
    let setCookie2 = await cookie.serialize(value);
    expect(setCookie).not.toEqual(setCookie2);
  });

  it("makes the default secrets to be an empty array", async () => {
    let cookie = createCookie("my-cookie");

    expect(cookie.isSigned).toBe(false);

    let cookie2 = createCookie("my-cookie2", {
      secrets: undefined,
    });

    expect(cookie2.isSigned).toBe(false);
  });

  it("makes the default path of cookies to be /", async () => {
    let cookie = createCookie("my-cookie");

    let setCookie = await cookie.serialize("hello world");
    expect(setCookie).toContain("Path=/");

    let cookie2 = createCookie("my-cookie2");

    let setCookie2 = await cookie2.serialize("hello world", {
      path: "/about",
    });
    expect(setCookie2).toContain("Path=/about");
  });

  it("supports the Priority attribute", async () => {
    let cookie = createCookie("my-cookie");

    let setCookie = await cookie.serialize("hello world");
    expect(setCookie).not.toContain("Priority");

    let cookie2 = createCookie("my-cookie2");

    let setCookie2 = await cookie2.serialize("hello world", {
      priority: "high",
    });
    expect(setCookie2).toContain("Priority=High");
  });

  describe("warnings when providing options you may not want to", () => {
    let spy = spyConsole();

    it("warns against using `expires` when creating the cookie instance", async () => {
      createCookie("my-cookie", { expires: new Date(Date.now() + 60_000) });
      expect(spy.console).toHaveBeenCalledTimes(1);
      expect(spy.console).toHaveBeenCalledWith(
        'The "my-cookie" cookie has an "expires" property set. This will cause the expires value to not be updated when the session is committed. Instead, you should set the expires value when serializing the cookie. You can use `commitSession(session, { expires })` if using a session storage object, or `cookie.serialize("value", { expires })` if you\'re using the cookie directly.',
      );
    });
  });

  describe("custom encoding/decoding", () => {
    it("uses default base64 encoding when no functions are provided", async () => {
      let rawCookieValue = "hello world";
      let cookie = createCookie("my-cookie");
      let setCookie = await cookie.serialize(rawCookieValue);
      expect(setCookie).toContain("my-cookie=ImhlbGxvIHdvcmxkIg%3D%3D;");
      let parsed = await cookie.parse(getCookieFromSetCookie(setCookie));
      expect(parsed).toBe(rawCookieValue);
    });

    it("keeps encode/decode scoped to cookie-es encoding", async () => {
      let rawCookieValue = "hello world";
      let encodedValue = "ImhlbGxvIHdvcmxkIg==";
      let encodeValue: string | undefined;
      let decodeValue: string | undefined;
      let cookie = createCookie("my-cookie", {
        encode(str: string) {
          encodeValue = str;
          return encodeURIComponent(str);
        },
        decode(str: string) {
          decodeValue = str;
          return decodeURIComponent(str);
        },
      });
      let setCookie = await cookie.serialize(rawCookieValue);
      expect(encodeValue).toBe(encodedValue);
      expect(setCookie).toContain("my-cookie=ImhlbGxvIHdvcmxkIg%3D%3D;");
      let parsed = await cookie.parse(getCookieFromSetCookie(setCookie));
      expect(decodeValue).toBe("ImhlbGxvIHdvcmxkIg%3D%3D");
      expect(parsed).toBe(rawCookieValue);
    });

    it("keeps usage-time encode/decode scoped to cookie-es encoding", async () => {
      let rawCookieValue = "hello world";
      let cookie = createCookie("my-cookie");
      let encodedValue = "ImhlbGxvIHdvcmxkIg==";
      let encodeValue: string | undefined;
      let decodeValue: string | undefined;
      let setCookie = await cookie.serialize(rawCookieValue, {
        encode(str: string) {
          encodeValue = str;
          return encodeURIComponent(str);
        },
      });
      expect(encodeValue).toBe(encodedValue);
      expect(setCookie).toContain("my-cookie=ImhlbGxvIHdvcmxkIg%3D%3D;");
      let parsed = await cookie.parse(getCookieFromSetCookie(setCookie), {
        decode(str: string) {
          decodeValue = str;
          return decodeURIComponent(str);
        },
      });
      expect(decodeValue).toBe("ImhlbGxvIHdvcmxkIg%3D%3D");
      expect(parsed).toBe(rawCookieValue);
    });

    it("applies custom encoding after signing", async () => {
      let rawCookieValue = "hello world";
      let encodedValue = "ImhlbGxvIHdvcmxkIg==";
      let encodeValue: string | undefined;
      let decodeValue: string | undefined;
      let cookie = createCookie("my-cookie", {
        secrets: ["s3cr3t"],
        encode(str: string) {
          encodeValue = str;
          return encodeURIComponent(str);
        },
        decode(str: string) {
          decodeValue = str;
          return decodeURIComponent(str);
        },
      });
      let setCookie = await cookie.serialize(rawCookieValue);
      expect(encodeValue?.startsWith(`${encodedValue}.`)).toBe(true);
      expect(setCookie).toContain("my-cookie=ImhlbGxvIHdvcmxkIg%3D%3D.");
      let parsed = await cookie.parse(getCookieFromSetCookie(setCookie));
      expect(decodeValue?.startsWith("ImhlbGxvIHdvcmxkIg%3D%3D.")).toBe(true);
      expect(parsed).toBe(rawCookieValue);

      // Fails if the cookie value is tampered with
      let [, signature] = getCookieFromSetCookie(setCookie).split(".");
      parsed = await cookie.parse(
        `my-cookie=Im1hcnMi.${signature}`,
      );
      expect(parsed).toBe(null);
    });

    it("unstable_v9_createCookie uses the remix cookie default encoding", async () => {
      let rawCookieValue = "hello world";
      let cookie = unstable_v9_createCookie("my-cookie");

      let setCookie = await cookie.serialize(rawCookieValue);
      expect(setCookie).toContain("my-cookie=aGVsbG8gd29ybGQ=;");

      let parsed = await cookie.parse(getCookieFromSetCookie(setCookie));
      expect(parsed).toBe(rawCookieValue);
    });

    it("unstable_v9_createCookie exposes the remix cookie object shape", async () => {
      let cookie = unstable_v9_createCookie("my-cookie", {
        secrets: ["s3cr3t"],
      });

      expect(cookie.signed).toBe(true);
      expect(cookie.path).toBe("/");
    });

    it("unstable_v9_createCookie uses custom encode/decode as the value codec", async () => {
      let rawCookieValue = "hello world";
      let encodeValue: string | undefined;
      let decodeValue: string | undefined;
      let cookie = unstable_v9_createCookie("my-cookie", {
        encode(str: string) {
          encodeValue = str;
          return str.replaceAll(" ", "-");
        },
        decode(str: string) {
          decodeValue = str;
          return str.replaceAll("-", " ");
        },
      });

      let setCookie = await cookie.serialize(rawCookieValue);
      expect(encodeValue).toBe(rawCookieValue);
      expect(setCookie).toContain("my-cookie=hello-world;");

      let parsed = await cookie.parse(getCookieFromSetCookie(setCookie));
      expect(decodeValue).toBe("hello-world");
      expect(parsed).toBe(rawCookieValue);
    });

    it("unstable_v9_createCookie supports unicode values with custom codecs", async () => {
      let rawCookieValue = "日本語";
      let cookie = unstable_v9_createCookie("my-cookie", {
        encode: encodeURIComponent,
        decode: decodeURIComponent,
      });

      let setCookie = await cookie.serialize(rawCookieValue);
      expect(setCookie).toContain(
        "my-cookie=%E6%97%A5%E6%9C%AC%E8%AA%9E;",
      );

      let parsed = await cookie.parse(getCookieFromSetCookie(setCookie));
      expect(parsed).toBe(rawCookieValue);
    });

    it("unstable_v9_createCookie signs encoded values without wrapping them in base64", async () => {
      let rawCookieValue = "hello world";
      let encodeValue: string | undefined;
      let decodeValue: string | undefined;
      let cookie = unstable_v9_createCookie("my-cookie", {
        secrets: ["s3cr3t"],
        encode(str: string) {
          encodeValue = str;
          return encodeURIComponent(str);
        },
        decode(str: string) {
          decodeValue = str;
          return decodeURIComponent(str);
        },
      });

      let setCookie = await cookie.serialize(rawCookieValue);
      expect(encodeValue).toBe(rawCookieValue);
      expect(setCookie).toContain("my-cookie=hello%20world.");

      let parsed = await cookie.parse(getCookieFromSetCookie(setCookie));
      expect(decodeValue).toBe("hello%20world");
      expect(parsed).toBe(rawCookieValue);

      // Fails if the cookie value is tampered with
      let [, signature] = getCookieFromSetCookie(setCookie).split(".");
      parsed = await cookie.parse(`my-cookie=hello%20mars.${signature}`);
      expect(parsed).toBe(null);
    });

    it("can use unstable_v9_createCookie for v8-compatible string cookies", async () => {
      let value = "日本語";
      let scenarios = [{ secrets: [] }, { secrets: ["s3cr3t"] }];

      for (let { secrets } of scenarios) {
        let oldPrefs = createCookie("prefs", { secrets });
        let newPrefs = unstable_v9_createCookie("prefs", {
          secrets,
          encode(value) {
            return encodeUtf8Base64(JSON.stringify(value));
          },
          decode(value) {
            return JSON.parse(decodeUtf8Base64(value));
          },
        });

        let oldSetCookie = await oldPrefs.serialize(value);
        let newSetCookie = await newPrefs.serialize(value);

        expect(await oldPrefs.parse(getCookieFromSetCookie(newSetCookie))).toBe(
          value,
        );
        expect(
          await newPrefs.parse(
            decodeCookieHeaderValues(getCookieFromSetCookie(oldSetCookie)),
          ),
        ).toBe(value);
      }
    });

    it("can use unstable_v9_createCookie for v8-compatible object cookies", async () => {
      let value = { displayName: "みち", theme: "dark" };
      let scenarios = [{ secrets: [] }, { secrets: ["s3cr3t"] }];

      for (let { secrets } of scenarios) {
        let oldPrefs = createCookie("prefs", { secrets });
        let newPrefs = unstable_v9_createCookie("prefs", {
          secrets,
          encode: encodeUtf8Base64,
          decode: decodeUtf8Base64,
        });

        let oldSetCookie = await oldPrefs.serialize(value);
        let newSetCookie = await newPrefs.serialize(JSON.stringify(value));

        expect(await oldPrefs.parse(getCookieFromSetCookie(newSetCookie))).toEqual(
          value,
        );

        let newValue = await newPrefs.parse(
          decodeCookieHeaderValues(getCookieFromSetCookie(oldSetCookie)),
        );
        expect(JSON.parse(newValue!)).toEqual(value);
      }
    });
  });
});

function encodeUtf8Base64(value: string): string {
  return btoa(
    Array.from(new TextEncoder().encode(value), (byte) =>
      String.fromCharCode(byte),
    ).join(""),
  );
}

function decodeUtf8Base64(value: string): string {
  let binary = atob(decodeURIComponent(value));
  return new TextDecoder().decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  );
}

function decodeCookieHeaderValues(cookieHeader: string): string {
  return cookieHeader
    .split(/;\s*/)
    .map((cookie) => {
      let separator = cookie.indexOf("=");
      if (separator === -1) return cookie;
      return [
        cookie.slice(0, separator),
        decodeURIComponent(cookie.slice(separator + 1)),
      ].join("=");
    })
    .join("; ");
}

function spyConsole() {
  // https://github.com/facebook/react/issues/7047
  let spy: any = {};

  beforeAll(() => {
    spy.console = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  beforeEach(() => {
    spy.console.mockClear();
  });

  afterAll(() => {
    spy.console.mockRestore();
  });

  return spy;
}
