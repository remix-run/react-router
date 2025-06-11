"use client-entry";

import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_createCallServer,
  unstable_getServerStream,
  unstable_RSCHydratedRouter,
} from "react-router";
import type { unstable_ServerPayload } from "react-router/rsc";
import {
  createFromReadableStream,
  encodeReply,
  setServerCallback,
  // @ts-expect-error
} from "react-server-dom-parcel/client";

const callServer = unstable_createCallServer({
  decode: (body) => createFromReadableStream(body, { callServer }),
  encodeAction: (args) => encodeReply(args),
});

setServerCallback(callServer);

createFromReadableStream(unstable_getServerStream(), {
  assets: "manifest",
}).then((payload: unstable_ServerPayload) => {
  React.startTransition(() => {
    hydrateRoot(
      document,
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(unstable_RSCHydratedRouter, {
          decode: (body) => createFromReadableStream(body),
          // @ts-expect-error
          payload,
        })
      )
    );
  });
});
