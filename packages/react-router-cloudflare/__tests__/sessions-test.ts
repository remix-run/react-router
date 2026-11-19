/**
 * @jest-environment node
 */

import { createCookie, createSession } from "react-router";

import { createWorkersKVSessionStorage } from "../sessions/workersKVStorage";

function createMockKV() {
  let values = new Map<string, string>();
  let kv = {
    get: jest.fn(async (key: string, type?: "json") => {
      let value = values.get(key) ?? null;
      return type === "json" && value ? JSON.parse(value) : value;
    }),
    put: jest.fn(async (key: string, value: string, _options?: unknown) => {
      values.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
  return { values, kv, namespace: kv as unknown as KVNamespace };
}

function getCookieFromSetCookie(setCookie: string): string {
  return setCookie.split(/;\s*/)[0];
}

describe("Workers KV session storage", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(
    [
      "invalid-session-id",
      "0123456789abcdeg",
      "0123456789abcde",
      "0123456789abcdef0",
      "0123456789abcdef\n",
      ["0123456789abcdef"],
      { id: "invalid-session-id" },
      1234567890123456,
      true,
      null,
    ].map((id) => [id]),
  )("returns a new session for unsupported IDs: %j", async (id) => {
    let { kv, namespace, values } = createMockKV();
    values.set("fedcba9876543210", JSON.stringify({ user: "existing-user" }));
    let cookie = createCookie("__session");
    let storage = createWorkersKVSessionStorage({ kv: namespace, cookie });
    let cookieHeader = getCookieFromSetCookie(await cookie.serialize(id));

    let session = await storage.getSession(cookieHeader);
    expect(session.id).toBe("");
    expect(session.data).toEqual({});
    expect(kv.get).not.toHaveBeenCalled();

    let expiredCookie = await storage.destroySession(session);
    expect(expiredCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(kv.delete).not.toHaveBeenCalled();

    session.set("user", "mjackson");
    let setCookie = await storage.commitSession(session);
    let newId = await cookie.parse(getCookieFromSetCookie(setCookie));
    expect(newId).toMatch(/^[0-9a-f]{16}$/);
    expect(newId).not.toEqual(id);
    expect(kv.get).toHaveBeenCalledTimes(1);
    expect(kv.get).toHaveBeenCalledWith(newId, "json");
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(kv.put).toHaveBeenCalledWith(
      newId,
      JSON.stringify({ user: "mjackson" }),
      { expiration: undefined },
    );
    expect((await storage.getSession(setCookie)).get("user")).toBe("mjackson");
    expect(values.get("fedcba9876543210")).toBe(
      JSON.stringify({ user: "existing-user" }),
    );
  });

  it.each(
    [
      "invalid-session-id",
      ["0123456789abcdef"],
      { id: "invalid-session-id" },
    ].map((id) => [id]),
  )(
    "persists session data with a new ID when given an unsupported ID: %j",
    async (id) => {
      let { kv, namespace, values } = createMockKV();
      values.set("fedcba9876543210", JSON.stringify({ user: "existing-user" }));
      let cookie = createCookie("__session", { secrets: ["secret1"] });
      let storage = createWorkersKVSessionStorage({ kv: namespace, cookie });
      let session = createSession({ user: "mjackson" }, id as string);
      session.flash("error", "boom");

      await storage.destroySession(session);
      expect(kv.delete).not.toHaveBeenCalled();

      let setCookie = await storage.commitSession(session);
      let newId = await cookie.parse(getCookieFromSetCookie(setCookie));
      expect(newId).toMatch(/^[0-9a-f]{16}$/);
      expect(kv.put).toHaveBeenCalledTimes(1);
      expect(kv.put.mock.calls[0][0]).toBe(newId);
      let persisted = await storage.getSession(setCookie);
      expect(persisted.get("user")).toBe("mjackson");
      expect(persisted.get("error")).toBe("boom");
      expect(values.get("fedcba9876543210")).toBe(
        JSON.stringify({ user: "existing-user" }),
      );
    },
  );

  it.each([{ secrets: [] }, { secrets: ["secret1"] }])(
    "persists and removes session data with cookie secrets %j",
    async ({ secrets }) => {
      let { kv, namespace, values } = createMockKV();
      let cookie = createCookie("__session", { secrets });
      let storage = createWorkersKVSessionStorage({
        kv: namespace,
        cookie: { name: cookie.name, secrets },
      });
      let session = await storage.getSession();
      session.set("user", "mjackson");
      let expires = new Date("2030-01-01T00:00:00Z");
      let setCookie = await storage.commitSession(session, { expires });
      let id = await cookie.parse(getCookieFromSetCookie(setCookie));
      expect(id).toMatch(/^[0-9a-f]{16}$/);
      expect(kv.put).toHaveBeenLastCalledWith(
        id,
        JSON.stringify({ user: "mjackson" }),
        { expiration: expires.getTime() / 1000 },
      );

      session = await storage.getSession(setCookie);
      expect(session.id).toBe(id);
      expect(session.get("user")).toBe("mjackson");
      session.set("user", "ryanflorence");
      setCookie = await storage.commitSession(session, { expires });
      expect(await cookie.parse(getCookieFromSetCookie(setCookie))).toBe(id);
      expect((await storage.getSession(setCookie)).get("user")).toBe(
        "ryanflorence",
      );
      await storage.destroySession(session);
      expect(kv.delete).toHaveBeenCalledWith(id);
      expect(values.has(id)).toBe(false);
      expect((await storage.getSession(setCookie)).data).toEqual({});
    },
  );

  it("retains valid uppercase IDs when the stored session is missing", async () => {
    let { kv, namespace } = createMockKV();
    let cookie = createCookie("__session", { secrets: ["secret1"] });
    let storage = createWorkersKVSessionStorage({ kv: namespace, cookie });
    let id = "0123456789ABCDEF";
    let session = await storage.getSession(await cookie.serialize(id));
    expect(session.id).toBe(id);
    expect(session.data).toEqual({});
    session.set("user", "mjackson");
    let setCookie = await storage.commitSession(session);
    expect(await cookie.parse(getCookieFromSetCookie(setCookie))).toBe(id);
    expect(kv.put).toHaveBeenCalledWith(
      id,
      JSON.stringify({ user: "mjackson" }),
      { expiration: undefined },
    );
    await storage.destroySession(session);
    expect(kv.delete).toHaveBeenCalledWith(id);
  });

  it("returns an empty session for cookies that are not signed properly", async () => {
    let { kv, namespace, values } = createMockKV();
    let id = "0123456789abcdef";
    values.set(id, JSON.stringify({ user: "mjackson" }));
    let cookie = createCookie("__session", { secrets: ["secret1"] });
    let storage = createWorkersKVSessionStorage({ kv: namespace, cookie });
    let wrongCookie = createCookie("__session", { secrets: ["wrong-secret"] });
    let unsignedCookie = createCookie("__session");

    for (let invalidCookie of [wrongCookie, unsignedCookie]) {
      let session = await storage.getSession(await invalidCookie.serialize(id));
      expect(session.id).toBe("");
      expect(session.data).toEqual({});
      await storage.destroySession(session);
    }
    expect(kv.get).not.toHaveBeenCalled();
    expect(kv.delete).not.toHaveBeenCalled();

    let session = await storage.getSession(await cookie.serialize(id));
    expect(session.id).toBe(id);
    expect(session.get("user")).toBe("mjackson");
  });
});
