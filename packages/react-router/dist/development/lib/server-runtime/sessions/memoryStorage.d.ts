
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
 * Creates and returns a simple in-memory SessionStorage object.
 *
 * Intended for local development and testing. It does not scale beyond a single
 * process, and all session data is lost when the server process stops/restarts.
 *
 * @public
 * @category Utils
 * @mode framework
 * @mode data
 * @param options Options for creating the in-memory session storage.
 * @returns A {@link SessionStorage} object that stores session data in memory.
 */
declare function createMemorySessionStorage<Data = SessionData, FlashData = Data>({
  cookie
}?: MemorySessionStorageOptions): SessionStorage<Data, FlashData>;
//#endregion
export { createMemorySessionStorage };