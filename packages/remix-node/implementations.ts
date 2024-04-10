import {
  createCookieFactory,
  createCookieSessionStorageFactory,
  createMemorySessionStorageFactory,
  createSessionStorageFactory,
} from "@react-router/server-runtime";

import { sign, unsign } from "./crypto";

export const createCookie = createCookieFactory({ sign, unsign });
export const createCookieSessionStorage =
  createCookieSessionStorageFactory(createCookie);
export const createSessionStorage = createSessionStorageFactory(createCookie);
export const createMemorySessionStorage =
  createMemorySessionStorageFactory(createSessionStorage);
