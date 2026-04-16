/**
 * @react-router/architect v7.14.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  createArcTableSessionStorage: () => createArcTableSessionStorage,
  createRequestHandler: () => createRequestHandler
});
module.exports = __toCommonJS(index_exports);

// sessions/arcTableSessionStorage.ts
var import_react_router = require("react-router");
var import_functions = __toESM(require("@architect/functions"));
function createArcTableSessionStorage({
  cookie,
  ...props
}) {
  async function getTable() {
    if (typeof props.table === "string") {
      let tables = await import_functions.default.tables();
      return tables[props.table];
    } else {
      return props.table;
    }
  }
  return (0, import_react_router.createSessionStorage)({
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
var import_react_router2 = require("react-router");
var import_node = require("@react-router/node");

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
  let handleRequest = (0, import_react_router2.createRequestHandler)(build, mode);
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
      body = await (0, import_node.readableStreamToString)(nodeResponse.body, "base64");
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createArcTableSessionStorage,
  createRequestHandler
});
