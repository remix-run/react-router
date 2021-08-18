import type {
  ActionFunction as CoreActionFunction,
  HeadersFunction as CoreHeadersFunction,
  LoaderFunction as CoreLoaderFunction
} from "@remix-run/server-runtime";

import type { Headers, HeadersInit, Request, Response } from "./fetch";

export type ActionFunction = CoreActionFunction<Request, Response>;

export type HeadersFunction = CoreHeadersFunction<Headers, HeadersInit>;

export type LoaderFunction = CoreLoaderFunction<Request, Response>;
