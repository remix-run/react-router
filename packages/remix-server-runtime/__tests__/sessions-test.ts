import { createCookieFactory } from "../cookies";
import type { SignFunction, UnsignFunction } from "../crypto";
import {
  createSession,
  createSessionStorageFactory,
  isSession,
} from "../sessions";
import { createCookieSessionStorageFactory } from "../sessions/cookieStorage";
import { createMemorySessionStorageFactory } from "../sessions/memoryStorage";

function getCookieFromSetCookie(setCookie: string): string {
  return setCookie.split(/;\s*/)[0];
}

const sign: SignFunction = async (value, secret) => {
  return JSON.stringify({ value, secret });
};
const unsign: UnsignFunction = async (signed, secret) => {
  try {
    let unsigned = JSON.parse(signed);
    if (unsigned.secret !== secret) return false;
    return unsigned.value;
  } catch (e: unknown) {
    return false;
  }
};
const createCookie = createCookieFactory({ sign, unsign });
const createCookieSessionStorage =
  createCookieSessionStorageFactory(createCookie);
const createSessionStorage = createSessionStorageFactory(createCookie);
const createMemorySessionStorage =
  createMemorySessionStorageFactory(createSessionStorage);

describe("Session", () => {
  it("has an empty id by default", () => {
    expect(createSession().id).toEqual("");
  });

  it("correctly stores and retrieves values", () => {
    let session = createSession();

    session.set("user", "mjackson");
    session.flash("error", "boom");

    expect(session.has("user")).toBe(true);
    expect(session.get("user")).toBe("mjackson");
    // Normal values should remain in the session after get()
    expect(session.has("user")).toBe(true);
    expect(session.get("user")).toBe("mjackson");

    expect(session.has("error")).toBe(true);
    expect(session.get("error")).toBe("boom");
    // Flash values disappear after the first get()
    expect(session.has("error")).toBe(false);
    expect(session.get("error")).toBeUndefined();

    session.unset("user");

    expect(session.has("user")).toBe(false);
    expect(session.get("user")).toBeUndefined();
  });
});

describe("isSession", () => {
  it("returns `true` for Session objects", () => {
    expect(isSession(createSession())).toBe(true);
  });

  it("returns `false` for non-Session objects", () => {
    expect(isSession({})).toBe(false);
    expect(isSession([])).toBe(false);
    expect(isSession("")).toBe(false);
    expect(isSession(true)).toBe(false);
  });
});

describe("In-memory session storage", () => {
  it("persists session data across requests", async () => {
    let { getSession, commitSession } = createMemorySessionStorage({
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    session.set("user", "mjackson");
    let setCookie = await commitSession(session);
    session = await getSession(getCookieFromSetCookie(setCookie));

    expect(session.get("user")).toEqual("mjackson");
  });
});

describe("Cookie session storage", () => {
  it("persists session data across requests", async () => {
    let { getSession, commitSession } = createCookieSessionStorage({
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    session.set("user", "mjackson");
    let setCookie = await commitSession(session);
    session = await getSession(getCookieFromSetCookie(setCookie));

    expect(session.get("user")).toEqual("mjackson");
  });

  it("returns an empty session for cookies that are not signed properly", async () => {
    let { getSession, commitSession } = createCookieSessionStorage({
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    session.set("user", "mjackson");

    expect(session.get("user")).toEqual("mjackson");

    let setCookie = await commitSession(session);
    session = await getSession(
      // Tamper with the session cookie...
      getCookieFromSetCookie(setCookie).slice(0, -1)
    );

    expect(session.get("user")).toBeUndefined();
  });

  it('"makes the default path of cookies to be /', async () => {
    let { getSession, commitSession } = createCookieSessionStorage({
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    session.set("user", "mjackson");
    let setCookie = await commitSession(session);
    expect(setCookie).toContain("Path=/");
  });

  it("throws an error when the cookie size exceeds 4096 bytes", async () => {
    let { getSession, commitSession } = createCookieSessionStorage({
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    let longString = new Array(4097).fill("a").join("");
    session.set("over4096bytes", longString);
    await expect(() => commitSession(session)).rejects.toThrow();
  });

  describe("when a new secret shows up in the rotation", () => {
    it("unsigns old session cookies using the old secret and encodes new cookies using the new secret", async () => {
      let { getSession, commitSession } = createCookieSessionStorage({
        cookie: { secrets: ["secret1"] },
      });
      let session = await getSession();
      session.set("user", "mjackson");
      let setCookie = await commitSession(session);
      session = await getSession(getCookieFromSetCookie(setCookie));

      expect(session.get("user")).toEqual("mjackson");

      // A new secret enters the rotation...
      let storage = createCookieSessionStorage({
        cookie: { secrets: ["secret2", "secret1"] },
      });
      getSession = storage.getSession;
      commitSession = storage.commitSession;

      // Old cookies should still work with the old secret.
      session = await storage.getSession(getCookieFromSetCookie(setCookie));
      expect(session.get("user")).toEqual("mjackson");

      // New cookies should be signed using the new secret.
      let setCookie2 = await storage.commitSession(session);
      expect(setCookie2).not.toEqual(setCookie);
    });
  });
});
