/**
 * @react-router/cloudflare v7.14.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  createPagesFunctionHandler: () => createPagesFunctionHandler,
  createRequestHandler: () => createRequestHandler,
  createWorkersKVSessionStorage: () => createWorkersKVSessionStorage
});
module.exports = __toCommonJS(index_exports);

// sessions/workersKVStorage.ts
var import_react_router = require("react-router");
function createWorkersKVSessionStorage({
  cookie,
  kv
}) {
  return (0, import_react_router.createSessionStorage)({
    cookie,
    async createData(data, expires) {
      while (true) {
        let randomBytes = crypto.getRandomValues(new Uint8Array(8));
        let id = [...randomBytes].map((x) => x.toString(16).padStart(2, "0")).join("");
        if (await kv.get(id, "json")) {
          continue;
        }
        await kv.put(id, JSON.stringify(data), {
          expiration: expires ? Math.round(expires.getTime() / 1e3) : void 0
        });
        return id;
      }
    },
    async readData(id) {
      let session = await kv.get(id);
      if (!session) {
        return null;
      }
      return JSON.parse(session);
    },
    async updateData(id, data, expires) {
      await kv.put(id, JSON.stringify(data), {
        expiration: expires ? Math.round(expires.getTime() / 1e3) : void 0
      });
    },
    async deleteData(id) {
      await kv.delete(id);
    }
  });
}

// worker.ts
var import_react_router2 = require("react-router");
function createRequestHandler({
  build,
  mode,
  getLoadContext = ({ context }) => ({
    ...context,
    cloudflare: {
      ...context.cloudflare,
      cf: context.cloudflare.request.cf
    }
  })
}) {
  let handleRequest = (0, import_react_router2.createRequestHandler)(build, mode);
  return async (cloudflare) => {
    let loadContext = await getLoadContext({
      request: cloudflare.request,
      context: {
        cloudflare: {
          ...cloudflare,
          cf: cloudflare.request.cf,
          ctx: {
            waitUntil: cloudflare.waitUntil.bind(cloudflare),
            passThroughOnException: cloudflare.passThroughOnException.bind(cloudflare)
          },
          caches
        }
      }
    });
    return handleRequest(cloudflare.request, loadContext);
  };
}
function createPagesFunctionHandler({
  build,
  getLoadContext,
  mode
}) {
  let handleRequest = createRequestHandler({
    build,
    getLoadContext,
    mode
  });
  let handleFetch = async (context) => {
    let response;
    context.request.headers.delete("if-none-match");
    try {
      response = await context.env.ASSETS.fetch(
        context.request.url,
        context.request.clone()
      );
      response = response && response.status >= 200 && response.status < 400 ? new Response(response.body, response) : void 0;
    } catch {
    }
    if (!response) {
      response = await handleRequest(context);
    }
    return response;
  };
  return async (context) => {
    try {
      return await handleFetch(context);
    } catch (error) {
      if (process.env.NODE_ENV === "development" && error instanceof Error) {
        console.error(error);
        return new Response(error.message || error.toString(), {
          status: 500
        });
      }
      return new Response("Internal Error", {
        status: 500
      });
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createPagesFunctionHandler,
  createRequestHandler,
  createWorkersKVSessionStorage
});
