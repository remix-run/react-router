/**
 * @jest-environment node
 */

import path from "node:path";
import { promises as fsp } from "node:fs";
import os from "node:os";

import { createFileSessionStorage, getFile } from "../sessions/fileStorage";

function getCookieFromSetCookie(setCookie: string): string {
  return setCookie.split(/;\s*/)[0];
}

describe("File session storage", () => {
  let dir = path.join(os.tmpdir(), "file-session-storage");

  beforeAll(async () => {
    await fsp.mkdir(dir, { recursive: true });
  });

  afterAll(async () => {
    await fsp.rm(dir, { recursive: true, force: true });
  });

  it("persists session data across requests", async () => {
    let { getSession, commitSession } = createFileSessionStorage({
      dir,
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    session.set("user", "mjackson");
    let setCookie = await commitSession(session);
    session = await getSession(getCookieFromSetCookie(setCookie));

    expect(session.get("user")).toEqual("mjackson");
  });

  it("returns an empty session for cookies that are not signed properly", async () => {
    let { getSession, commitSession } = createFileSessionStorage({
      dir,
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    session.set("user", "mjackson");

    expect(session.get("user")).toBe("mjackson");

    let setCookie = await commitSession(session);
    session = await getSession(
      // Tamper with the cookie...
      getCookieFromSetCookie(setCookie).slice(0, -1),
    );

    expect(session.get("user")).toBeUndefined();
  });

  it("doesn't destroy the entire session directory when destroying an empty file session", async () => {
    let { getSession, destroySession } = createFileSessionStorage({
      dir,
      cookie: { secrets: ["secret1"] },
    });

    let session = await getSession();

    await expect(destroySession(session)).resolves.not.toThrow();
  });

  it("saves expires to file if expires provided to commitSession when creating new cookie", async () => {
    let { getSession, commitSession } = createFileSessionStorage({
      dir,
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    session.set("user", "mjackson");
    let date = new Date(Date.now() + 1000 * 60);
    let cookieHeader = await commitSession(session, { expires: date });
    let createdSession = await getSession(cookieHeader);

    let { id } = createdSession;
    let fileContents = await fsp.readFile(getFile(dir, id), "utf8");
    let fileData = JSON.parse(fileContents);
    expect(fileData.expires).toEqual(date.toISOString());
  });

  it("saves expires to file if maxAge provided to commitSession when creating new cookie", async () => {
    let { getSession, commitSession } = createFileSessionStorage({
      dir,
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    session.set("user", "mjackson");
    let cookieHeader = await commitSession(session, { maxAge: 60 });
    let createdSession = await getSession(cookieHeader);

    let { id } = createdSession;
    let fileContents = await fsp.readFile(getFile(dir, id), "utf8");
    let fileData = JSON.parse(fileContents);
    expect(typeof fileData.expires).toBe("string");
  });

  describe("when a new secret shows up in the rotation", () => {
    it("unsigns old session cookies using the old secret and encodes new cookies using the new secret", async () => {
      let { getSession, commitSession } = createFileSessionStorage({
        dir,
        cookie: { secrets: ["secret1"] },
      });
      let session = await getSession();
      session.set("user", "mjackson");
      let setCookie = await commitSession(session);
      session = await getSession(getCookieFromSetCookie(setCookie));

      expect(session.get("user")).toEqual("mjackson");

      // A new secret enters the rotation...
      let storage = createFileSessionStorage({
        dir,
        cookie: { secrets: ["secret2", "secret1"] },
      });
      getSession = storage.getSession;
      commitSession = storage.commitSession;

      // Old cookies should still work with the old secret.
      session = await getSession(getCookieFromSetCookie(setCookie));
      expect(session.get("user")).toEqual("mjackson");

      // New cookies should be signed using the new secret.
      let setCookie2 = await commitSession(session);
      expect(setCookie2).not.toEqual(setCookie);
    });
  });
});
