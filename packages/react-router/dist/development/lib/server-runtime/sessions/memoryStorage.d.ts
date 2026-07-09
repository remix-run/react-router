
import { SessionData, SessionIdStorageStrategy, SessionStorage } from "../sessions.js";

//#region lib/server-runtime/sessions/memoryStorage.d.ts
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
declare function createMemorySessionStorage<Data = SessionData, FlashData = Data>({
  cookie
}?: MemorySessionStorageOptions): SessionStorage<Data, FlashData>;
//#endregion
export { createMemorySessionStorage };