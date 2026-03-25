/**
 * @react-router/architect v7.13.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */

// sessions/arcTableSessionStorage.ts
import { createSessionStorage } from "react-router";
import arc from "@architect/functions";
function createArcTableSessionStorage({
  cookie,
  ...props
}) {
  async function getTable() {
    if (typeof props.table === "string") {
      let tables = await arc.tables();
      return tables[props.table];
    } else {
      return props.table;
    }
  }
  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      let table = await getTable();
      while (true) {
        let randomBytes = crypto.getRandomValues(new Uint8Array(8));
        let id = [...randomBytes].map((x) => x.toString(16).padStart(2, "0")).join("");
        if (await table.get({ [props.idx]: id })) {
          continue;
        }
        let params = {
          [props.idx]: id,
          ...data
        };
        if (props.ttl) {
          params[props.ttl] = expires ? Math.round(expires.getTime() / 1e3) : void 0;
        }
        await table.put(params);
        return id;
      }
    },
    async readData(id) {
      let table = await getTable();
      let data = await table.get({ [props.idx]: id });
      if (data) {
        delete data[props.idx];
        if (props.ttl) delete data[props.ttl];
      }
      return data;
    },
    async updateData(id, data, expires) {
      let table = await getTable();
      let params = {
        [props.idx]: id,
        ...data
      };
      if (props.ttl) {
        params[props.ttl] = expires ? Math.round(expires.getTime() / 1e3) : void 0;
      }
      await table.put(params);
    },
    async deleteData(id) {
      let table = await getTable();
      await table.delete({ [props.idx]: id });
    }
  });
}

// server.ts
import { createRequestHandler as createReactRouterRequestHandler } from "react-router";
import { readableStreamToString } from "@react-router/node";

// binaryTypes.ts
var binaryTypes = [
  "application/octet-stream",
  // Docs
  "application/epub+zip",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.amazon.ebook",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Fonts
  "font/otf",
  "font/woff",
  "font/woff2",
  // Images
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/vnd.microsoft.icon",
  "image/webp",
  // Audio
  "audio/3gpp",
  "audio/aac",
  "audio/basic",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-aiff",
  "audio/x-midi",
  "audio/x-wav",
  // Video
  "video/3gpp",
  "video/mp2t",
  "video/mpeg",
  "video/ogg",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  // Archives
  "application/java-archive",
  "application/vnd.apple.installer+xml",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-bzip",
  "application/x-bzip2",
  "application/x-gzip",
  "application/x-java-archive",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-zip",
  "application/zip"
];
function isBinaryType(contentType) {
  if (!contentType) return false;
  let [test] = contentType.split(";");
  return binaryTypes.includes(test);
}

// server.ts
function createRequestHandler({
  build,
  getLoadContext,
  mode = process.env.NODE_ENV
}) {
  let handleRequest = createReactRouterRequestHandler(build, mode);
  return async (event) => {
    let request = createReactRouterRequest(event);
    let loadContext = await getLoadContext?.(event);
    let response = await handleRequest(request, loadContext);
    return sendReactRouterResponse(response);
  };
}
function createReactRouterRequest(event) {
  let host = event.headers["x-forwarded-host"] || event.headers.host;
  let search = event.rawQueryString.length ? `?${event.rawQueryString}` : "";
  let scheme = process.env.ARC_SANDBOX ? "http" : "https";
  let url = new URL(`${scheme}://${host}${event.rawPath}${search}`);
  let isFormData = event.headers["content-type"]?.includes(
    "multipart/form-data"
  );
  let controller = new AbortController();
  return new Request(url.href, {
    method: event.requestContext.http.method,
    headers: createReactRouterHeaders(event.headers, event.cookies),
    signal: controller.signal,
    body: event.body && event.isBase64Encoded ? isFormData ? Buffer.from(event.body, "base64") : Buffer.from(event.body, "base64").toString() : event.body
  });
}
function createReactRouterHeaders(requestHeaders, requestCookies) {
  let headers = new Headers();
  for (let [header, value] of Object.entries(requestHeaders)) {
    if (value) {
      headers.append(header, value);
    }
  }
  if (requestCookies) {
    headers.append("Cookie", requestCookies.join("; "));
  }
  return headers;
}
async function sendReactRouterResponse(nodeResponse) {
  let cookies = [];
  for (let [key, value] of nodeResponse.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      cookies.push(value);
    }
  }
  if (cookies.length) {
    nodeResponse.headers.delete("Set-Cookie");
  }
  let contentType = nodeResponse.headers.get("Content-Type");
  let isBase64Encoded = isBinaryType(contentType);
  let body;
  if (nodeResponse.body) {
    if (isBase64Encoded) {
      body = await readableStreamToString(nodeResponse.body, "base64");
    } else {
      body = await nodeResponse.text();
    }
  }
  return {
    statusCode: nodeResponse.status,
    headers: Object.fromEntries(nodeResponse.headers.entries()),
    cookies,
    body,
    isBase64Encoded
  };
}
export {
  createArcTableSessionStorage,
  createRequestHandler
};
