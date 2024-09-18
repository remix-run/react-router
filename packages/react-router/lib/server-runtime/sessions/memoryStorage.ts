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
 * Creates and returns a simple in-memory SessionStorage object, mostly useful
 * for testing and as a reference implementation.
 *
 * Note: This storage does not scale beyond a single process, so it is not
 * suitable for most production scenarios.
 */
export function createMemorySessionStorage<
  Data = SessionData,
  FlashData = Data
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
      let id = Math.random().toString(36).substring(2, 10);
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
