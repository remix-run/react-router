/**
 * @react-router/cloudflare v7.13.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */

// sessions/workersKVStorage.ts
import { createSessionStorage } from "react-router";
function createWorkersKVSessionStorage({
  cookie,
  kv
}) {
  return createSessionStorage({
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
import { createRequestHandler as createReactRouterRequestHandler } from "react-router";
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
  let handleRequest = createReactRouterRequestHandler(build, mode);
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
export {
  createPagesFunctionHandler,
  createRequestHandler,
  createWorkersKVSessionStorage
};
