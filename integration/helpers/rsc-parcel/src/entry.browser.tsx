"use client-entry";

import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_createCallServer as createCallServer,
  unstable_getServerStream as getServerStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import type { unstable_ServerPayload as ServerPayload } from "react-router/rsc";
import {
  createFromReadableStream,
  encodeReply,
  setServerCallback,
  // @ts-expect-error
} from "react-server-dom-parcel/client";

const callServer = createCallServer({
  decode: (body) => createFromReadableStream(body, { callServer }),
  encodeAction: (args) => encodeReply(args),
});

setServerCallback(callServer);

createFromReadableStream(getServerStream(), { assets: "manifest" }).then(
  (payload: ServerPayload) => {
    React.startTransition(() => {
      hydrateRoot(
        document,
        <React.StrictMode>
          <RSCHydratedRouter
            decode={createFromReadableStream}
            // @ts-expect-error
            payload={payload}
          />
        </React.StrictMode>
      );
    });
  }
);

if (process.env.NODE_ENV !== "production") {
  const ogError = console.error.bind(console);
  console.error = (...args) => {
    if (args[1] === Symbol.for("react-router.redirect")) {
      return;
    }
    ogError(...args);
  };
}
