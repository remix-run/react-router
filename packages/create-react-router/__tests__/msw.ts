import path from "node:path";
import fsp from "node:fs/promises";
import { setupServer } from "msw/node";
import { rest } from "msw";

import { githubHandlers } from "./github-mocks";

type RequestHandler = Parameters<typeof setupServer>[0];

let miscHandlers: Array<RequestHandler> = [
  rest.get(
    "https://registry.npmjs.org/react-router/latest",
    async (req, res, ctx) => {
      return res(ctx.body(JSON.stringify({ version: "123.0.0" })));
    }
  ),
  rest.head(
    "https://example.com/error/:status/template.tar.gz",
    async (req, res, ctx) => {
      return res(ctx.status(Number(req.params.status)));
    }
  ),
  rest.get(
    "https://example.com/error/:status/template.tar.gz",
    async (req, res, ctx) => {
      return res(ctx.status(Number(req.params.status)));
    }
  ),
  rest.head("https://example.com/template.tar.gz", async (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.get("https://example.com/template.tar.gz", async (req, res, ctx) => {
    let fileBuffer = await fsp.readFile(
      path.join(__dirname, "fixtures", "template.tar.gz")
    );

    return res(
      ctx.body(fileBuffer),
      ctx.set("Content-Type", "application/x-gzip")
    );
  }),
];

let server = setupServer(...githubHandlers, ...miscHandlers);
export { server };
