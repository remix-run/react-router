
import { Cookie, CookieOptions } from "./cookies.js";
import { CookieParseOptions, CookieSerializeOptions } from "cookie-es";

//#region lib/server-runtime/sessions.d.ts
/**
 * An object of name/value pairs to be used in the session.
 */
interface SessionData {
  [name: string]: any;
}
/**
 * Session persists data across HTTP requests.
 *
 * @see https://reactrouter.com/explanation/sessions-and-cookies#sessions
 */
interface Session<Data = SessionData, FlashData = Data> {
  /**
   * A unique identifier for this session.
   *
   * Note: This will be the empty string for newly created sessions and
   * sessions that are not backed by a database (i.e. cookie-based sessions).
   */
  readonly id: string;
  /**
   * The raw data contained in this session.
   *
   * This is useful mostly for SessionStorage internally to access the raw
   * session data to persist.
   */
  readonly data: FlashSessionData<Data, FlashData>;
  /**
   * Returns `true` if the session has a value for the given `name`, `false`
   * otherwise.
   */
  has(name: (keyof Data | keyof FlashData) & string): boolean;
  /**
   * Returns the value for the given `name` in this session.
   */
  get<Key extends (keyof Data | keyof FlashData) & string>(name: Key): (Key extends keyof Data ? Data[Key] : undefined) | (Key extends keyof FlashData ? FlashData[Key] : undefined) | undefined;
  /**
   * Sets a value in the session for the given `name`.
   */
  set<Key extends keyof Data & string>(name: Key, value: Data[Key]): void;
  /**
   * Sets a value in the session that is only valid until the next `get()`.
   * This can be useful for temporary values, like error messages.
   */
  flash<Key extends keyof FlashData & string>(name: Key, value: FlashData[Key]): void;
  /**
   * Removes a value from the session.
   */
  unset(name: keyof Data & string): void;
}
type FlashSessionData<Data, FlashData> = Partial<Data & { [Key in keyof FlashData as FlashDataKey<Key & string>]: FlashData[Key] }>;
type FlashDataKey<Key extends string> = `__flash_${Key}__`;
type CreateSessionFunction = <Data = SessionData, FlashData = Data>(initialData?: Data, id?: string) => Session<Data, FlashData>;
/**
 * Creates a new Session object.
 *
 * Note: This function is typically not invoked directly by application code.
 * Instead, use a `SessionStorage` object's `getSession` method.
 */
declare const createSession: CreateSessionFunction;
type IsSessionFunction = (object: any) => object is Session;
/**
 * Returns true if an object is a React Router session.
 *
 * @see https://reactrouter.com/api/utils/isSession
 */
declare const isSession: IsSessionFunction;
/**
 * SessionStorage stores session data between HTTP requests and knows how to
 * parse and create cookies.
 *
 * A SessionStorage creates Session objects using a `Cookie` header as input.
 * Then, later it generates the `Set-Cookie` header to be used in the response.
 */
interface SessionStorage<Data = SessionData, FlashData = Data> {
  /**
   * Parses a Cookie header from a HTTP request and returns the associated
   * Session. If there is no session associated with the cookie, this will
   * return a new Session with no data.
   */
  getSession: (cookieHeader?: string | null, options?: CookieParseOptions) => Promise<Session<Data, FlashData>>;
  /**
   * Stores all data in the Session and returns the Set-Cookie header to be
   * used in the HTTP response.
   */
  commitSession: (session: Session<Data, FlashData>, options?: CookieSerializeOptions) => Promise<string>;
  /**
   * Deletes all data associated with the Session and returns the Set-Cookie
   * header to be used in the HTTP response.
   */
  destroySession: (session: Session<Data, FlashData>, options?: CookieSerializeOptions) => Promise<string>;
}
/**
 * SessionIdStorageStrategy is designed to allow anyone to easily build their
 * own SessionStorage using `createSessionStorage(strategy)`.
 *
 * This strategy describes a common scenario where the session id is stored in
 * a cookie but the actual session data is stored elsewhere, usually in a
 * database or on disk. A set of create, read, update, and delete operations
 * are provided for managing the session data.
 */
interface SessionIdStorageStrategy<Data = SessionData, FlashData = Data> {
  /**
   * The Cookie used to store the session id, or options used to automatically
   * create one.
   */
  cookie?: Cookie | (CookieOptions & {
    name?: string;
  });
  /**
   * Creates a new record with the given data and returns the session id.
   */
  createData: (data: FlashSessionData<Data, FlashData>, expires?: Date) => Promise<string>;
  /**
   * Returns data for a given session id, or `null` if there isn't any.
   */
  readData: (id: string) => Promise<FlashSessionData<Data, FlashData> | null>;
  /**
   * Updates data for the given session id.
   */
  updateData: (id: string, data: FlashSessionData<Data, FlashData>, expires?: Date) => Promise<void>;
  /**
   * Deletes data for a given session id from the data store.
   */
  deleteData: (id: string) => Promise<void>;
}
/**
 * Creates a SessionStorage object using a SessionIdStorageStrategy.
 *
 * Note: This is a low-level API that should only be used if none of the
 * existing session storage options meet your requirements.
 */
declare function createSessionStorage<Data = SessionData, FlashData = Data>({
  cookie: cookieArg,
  createData,
  readData,
  updateData,
  deleteData
}: SessionIdStorageStrategy<Data, FlashData>): SessionStorage<Data, FlashData>;
//#endregion
export { FlashSessionData, IsSessionFunction, Session, SessionData, SessionIdStorageStrategy, SessionStorage, createSession, createSessionStorage, isSession };