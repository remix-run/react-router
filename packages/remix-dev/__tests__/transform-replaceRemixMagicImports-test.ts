import replaceRemixMagicImports from "../codemod/replace-remix-magic-imports/transform";
import * as eol from "./utils/eol";

it("replaces single-specifier imports", async () => {
  let code = [
    'import { json } from "remix"',
    'import type { GetLoadContextFunction } from "remix"',
    'import { type LinkProps } from "remix"',
  ].join("\n");
  let transform = replaceRemixMagicImports({
    runtime: "node",
    adapter: "express",
  });
  let result = eol.normalize(transform(code, "fake.tsx"));
  expect(result).toBe(
    [
      'import { type GetLoadContextFunction } from "@remix-run/express";',
      'import { json } from "@remix-run/node";',
      'import { type LinkProps } from "@remix-run/react";',
    ].join("\n")
  );
});

it("replaces single-kind, multi-specifier imports", async () => {
  let code = [
    'import { json, createRequestHandler, Form } from "remix"',
    'import type { ActionFunction, GetLoadContextFunction, LinkProps } from "remix"',
    'import { type Cookie, type RequestHandler, type NavLinkProps } from "remix"',
  ].join("\n");
  let transform = replaceRemixMagicImports({
    runtime: "node",
    adapter: "express",
  });
  let result = eol.normalize(transform(code, "fake.tsx"));
  expect(result).toBe(
    [
      'import { type GetLoadContextFunction, type RequestHandler, createRequestHandler } from "@remix-run/express";',
      'import { type ActionFunction, type Cookie, json } from "@remix-run/node";',
      'import { type LinkProps, type NavLinkProps, Form } from "@remix-run/react";',
    ].join("\n")
  );
});

it("replaces multi-kind, multi-specifier imports", async () => {
  let code = [
    'import { json, type ActionFunction, createRequestHandler, type GetLoadContextFunction, Form, type LinkProps } from "remix"',
  ].join("\n");
  let transform = replaceRemixMagicImports({
    runtime: "node",
    adapter: "express",
  });
  let result = eol.normalize(transform(code, "fake.tsx"));
  expect(result).toBe(
    [
      'import { type GetLoadContextFunction, createRequestHandler } from "@remix-run/express";',
      'import { type ActionFunction, json } from "@remix-run/node";',
      'import { type LinkProps, Form } from "@remix-run/react";',
    ].join("\n")
  );
});

it("replaces runtime-specific and adapter-specific imports", async () => {
  let code = [
    'import { json, createWorkersKVSessionStorage, createRequestHandler, createPagesFunctionHandler, Form } from "remix"',
    'import type { ActionFunction, GetLoadContextFunction, createPagesFunctionHandlerParams, LinkProps } from "remix"',
  ].join("\n");
  let transform = replaceRemixMagicImports({
    runtime: "cloudflare",
    adapter: "cloudflare-pages",
  });
  let result = eol.normalize(transform(code, "fake.tsx"));
  expect(result).toBe(
    [
      'import { type ActionFunction, createWorkersKVSessionStorage, json } from "@remix-run/cloudflare";',
      "", // recast adds a newline here https://github.com/benjamn/recast/issues/39
      "import {",
      "  type GetLoadContextFunction,",
      "  type createPagesFunctionHandlerParams,",
      "  createPagesFunctionHandler,",
      "  createRequestHandler,",
      '} from "@remix-run/cloudflare-pages";',
      "", // recast adds a newline here https://github.com/benjamn/recast/issues/39
      'import { type LinkProps, Form } from "@remix-run/react";',
    ].join("\n")
  );
});
