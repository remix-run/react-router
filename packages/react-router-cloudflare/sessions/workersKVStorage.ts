import type {
  SessionStorage,
  SessionIdStorageStrategy,
  SessionData,
} from "react-router";
import { createSession, createSessionStorage } from "react-router";

interface WorkersKVSessionStorageOptions {
  /**
   * The Cookie used to store the session id on the client, or options used
   * to automatically create one. Configure secrets to sign the cookie.
   */
  cookie?: SessionIdStorageStrategy["cookie"];

  /**
   * The KVNamespace used to store the sessions. Use a namespace dedicated
   * to session data.
   */
  kv: KVNamespace;
}

/**
 * Creates a SessionStorage that stores session data in the Clouldflare KV Store.
 *
 * The advantage of using this instead of cookie session storage is that
 * KV Store may contain much more data than cookies.
 */
export function createWorkersKVSessionStorage<
  Data = SessionData,
  FlashData = Data,
>({
  cookie,
  kv,
}: WorkersKVSessionStorageOptions): SessionStorage<Data, FlashData> {
  let storage = createSessionStorage<Data, FlashData>({
    cookie,
    async createData(data, expires) {
      while (true) {
        let randomBytes = crypto.getRandomValues(new Uint8Array(8));
        // This storage manages an id space of 2^64 ids, which is far greater
        // than the maximum number of files allowed on an NTFS or ext4 volume
        // (2^32). However, the larger id space should help to avoid collisions
        // with existing ids when creating new sessions, which speeds things up.
        let id = [...randomBytes]
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");

        if (await kv.get(id, "json")) {
          continue;
        }

        await kv.put(id, JSON.stringify(data), {
          expiration: expires
            ? Math.round(expires.getTime() / 1000)
            : undefined,
        });

        return id;
      }
    },
    async readData(id) {
      if (!isValidSessionId(id)) {
        return null;
      }
      let session = await kv.get(id);

      if (!session) {
        return null;
      }

      return JSON.parse(session);
    },
    async updateData(id, data, expires) {
      if (!isValidSessionId(id)) {
        return;
      }
      await kv.put(id, JSON.stringify(data), {
        expiration: expires ? Math.round(expires.getTime() / 1000) : undefined,
      });
    },
    async deleteData(id) {
      if (!isValidSessionId(id)) {
        return;
      }
      await kv.delete(id);
    },
  });

  return {
    ...storage,
    async getSession(cookieHeader, options) {
      let session = await storage.getSession(cookieHeader, options);
      return isValidSessionId(session.id)
        ? session
        : createSession<Data, FlashData>();
    },
    async commitSession(session, options) {
      // A rejected id must create a new record instead of persisting in the cookie.
      return storage.commitSession(
        isValidSessionId(session.id) ? session : { ...session, id: "" },
        options,
      );
    },
  };
}

function isValidSessionId(id: unknown): id is string {
  return (
    typeof id === "string" && id.length === 16 && /^[0-9a-f]{16}$/i.test(id)
  );
}
