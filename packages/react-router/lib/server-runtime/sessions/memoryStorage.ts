import type {
  SessionData,
  SessionStorage,
  SessionIdStorageStrategy,
  FlashSessionData,
} from "../sessions";
import { createSessionStorage } from "../sessions";

interface MemorySessionStorageOptions {
  /**
   * The Cookie used to store the session id on the client, or options used
   * to automatically create one.
   */
  cookie?: SessionIdStorageStrategy["cookie"];
}

/**
 * Creates and returns a simple in-memory SessionStorage object.
 *
 * Intended for local development and testing. It does not scale beyond a single
 * process, and all session data is lost when the server process stops/restarts.
 */
export function createMemorySessionStorage<
  Data = SessionData,
  FlashData = Data,
>({ cookie }: MemorySessionStorageOptions = {}): SessionStorage<
  Data,
  FlashData
> {
  let map = new Map<
    string,
    { data: FlashSessionData<Data, FlashData>; expires?: Date }
  >();

  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      let id = crypto.randomUUID();
      map.set(id, { data, expires });
      return id;
    },
    async readData(id) {
      if (map.has(id)) {
        let { data, expires } = map.get(id)!;

        if (!expires || expires > new Date()) {
          return data;
        }

        // Remove expired session data.
        if (expires) map.delete(id);
      }

      return null;
    },
    async updateData(id, data, expires) {
      map.set(id, { data, expires });
    },
    async deleteData(id) {
      map.delete(id);
    },
  });
}
