import {
  json as coreJson,
  redirect as coreRedirect
} from "@remix-run/server-runtime";

import type {
  Response as NodeResponse,
  ResponseInit as NodeResponseInit
} from "./fetch";

export let json = (data: any, init: NodeResponseInit = {}) =>
  (coreJson(data, init as ResponseInit) as unknown) as NodeResponse;

export let redirect = (url: string, init: number | NodeResponseInit = 302) =>
  (coreRedirect(url, init as ResponseInit) as unknown) as NodeResponse;
