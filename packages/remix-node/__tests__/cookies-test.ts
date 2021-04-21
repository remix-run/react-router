import { createCookie, isCookie } from "../cookies";

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
  it("parses/serializes empty string values", () => {
    let cookie = createCookie("my-cookie");
    let setCookie = cookie.serialize("");
    let value = cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toMatchInlineSnapshot(`""`);
  });

  it("parses/serializes unsigned string values", () => {
    let cookie = createCookie("my-cookie");
    let setCookie = cookie.serialize("hello world");
    let value = cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toEqual("hello world");
  });

  it("parses/serializes unsigned boolean values", () => {
    let cookie = createCookie("my-cookie");
    let setCookie = cookie.serialize(true);
    let value = cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toBe(true);
  });

  it("parses/serializes signed string values", () => {
    let cookie = createCookie("my-cookie", {
      secrets: ["secret1"]
    });
    let setCookie = cookie.serialize("hello michael");
    let value = cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toMatchInlineSnapshot(`"hello michael"`);
  });

  it("parses/serializes signed object values", () => {
    let cookie = createCookie("my-cookie", {
      secrets: ["secret1"]
    });
    let setCookie = cookie.serialize({ hello: "mjackson" });
    let value = cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toMatchInlineSnapshot(`
      Object {
        "hello": "mjackson",
      }
    `);
  });

  it("supports secret rotation", () => {
    let cookie = createCookie("my-cookie", {
      secrets: ["secret1"]
    });
    let setCookie = cookie.serialize({ hello: "mjackson" });
    let value = cookie.parse(getCookieFromSetCookie(setCookie));

    expect(value).toMatchInlineSnapshot(`
      Object {
        "hello": "mjackson",
      }
    `);

    // A new secret enters the rotation...
    cookie = createCookie("my-cookie", {
      secrets: ["secret2", "secret1"]
    });

    // cookie should still be able to parse old cookies.
    let oldValue = cookie.parse(getCookieFromSetCookie(setCookie));
    expect(oldValue).toMatchObject(value);

    // New Set-Cookie should be different, it uses a differet secret.
    let setCookie2 = cookie.serialize(value);
    expect(setCookie).not.toEqual(setCookie2);
  });
});
