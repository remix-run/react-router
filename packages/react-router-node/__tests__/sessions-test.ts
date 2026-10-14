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

  it("returns an empty session for invalid session ids", async () => {
    let spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    let { getSession, commitSession } = createFileSessionStorage({
      dir,
    });

    let cookie = `__session=${btoa(JSON.stringify("0123456789abcdef"))}`;
    let session = await getSession(cookie);
    session.set("user", "mjackson");
    expect(session.get("user")).toBe("mjackson");
    let setCookie = await commitSession(session);
    session = await getSession(getCookieFromSetCookie(setCookie));
    expect(session.get("user")).toBe("mjackson");

    cookie = `__session=${btoa(JSON.stringify("0123456789abcdeg"))}`;
    session = await getSession(cookie);
    session.set("user", "mjackson");
    expect(session.get("user")).toBe("mjackson");

    setCookie = await commitSession(session);
    session = await getSession(getCookieFromSetCookie(setCookie));
    expect(session.get("user")).toBeUndefined();

    spy.mockRestore();
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

  if (process.platform !== "win32") {
    it.each([
      { mode: 0o600, umask: 0o022 },
      { mode: 0o640, umask: 0o077 },
    ])(
      "preserves existing file permissions when committing a session (mode $mode, umask $umask)",
      async ({ mode, umask }) => {
        let { getSession, commitSession } = createFileSessionStorage({
          dir,
          cookie: { secrets: ["secret1"] },
        });
        let session = await getSession();
        session.set("user", "mjackson");
        let cookie = getCookieFromSetCookie(await commitSession(session));
        session = await getSession(cookie);
        let file = getFile(dir, session.id);
        await fsp.chmod(file, mode);

        let originalUmask = process.umask(umask);
        try {
          session.set("user", "ryanflorence");
          await commitSession(session);

          expect((await getSession(cookie)).get("user")).toBe("ryanflorence");
          expect((await fsp.stat(file)).mode & 0o777).toBe(mode);
        } finally {
          process.umask(originalUmask);
        }
      },
    );
  }

  it("recreates a missing file when committing an existing session", async () => {
    let { getSession, commitSession } = createFileSessionStorage({
      dir,
      cookie: { secrets: ["secret1"] },
    });
    let cookie = getCookieFromSetCookie(
      await commitSession(await getSession()),
    );
    let session = await getSession(cookie);
    await fsp.unlink(getFile(dir, session.id));
    session.set("user", "mjackson");

    await commitSession(session);

    expect((await getSession(cookie)).get("user")).toBe("mjackson");
  });

  it("keeps the session readable when it is committed concurrently", async () => {
    let { getSession, commitSession } = createFileSessionStorage({
      dir,
      cookie: { secrets: ["secret1"] },
    });
    let cookie = getCookieFromSetCookie(
      await commitSession(await getSession()),
    );

    for (let i = 0; i < 10; i++) {
      let longSession = await getSession(cookie);
      longSession.set("value", "a".repeat(20_000));
      let shortSession = await getSession(cookie);
      shortSession.set("value", "b");

      await Promise.all([
        commitSession(longSession),
        commitSession(shortSession),
      ]);

      let session = await getSession(cookie);
      expect(["a".repeat(20_000), "b"]).toContain(session.get("value"));
    }
  });

  it("doesn't throw when reading a session that is being committed", async () => {
    let { getSession, commitSession } = createFileSessionStorage({
      dir,
      cookie: { secrets: ["secret1"] },
    });
    let session = await getSession();
    session.set("value", "a".repeat(64 * 1024));
    let cookie = getCookieFromSetCookie(await commitSession(session));
    session = await getSession(cookie);

    let reads: Promise<unknown>[] = [];
    for (let i = 0; i < 20; i++) {
      let committed = false;
      let commit = commitSession(session).finally(() => (committed = true));
      while (!committed) {
        reads.push(getSession(cookie));
        await new Promise((resolve) => setImmediate(resolve));
      }
      await commit;
    }

    let results = await Promise.allSettled(reads);
    expect(results.filter((result) => result.status === "rejected")).toEqual(
      [],
    );
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
