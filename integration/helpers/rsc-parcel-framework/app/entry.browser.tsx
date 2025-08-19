"use client-entry";

import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  type unstable_RSCPayload as RSCPayload,
  unstable_createCallServer as createCallServer,
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
  // @ts-expect-error
} from "react-server-dom-parcel/client";

setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  }),
);

createFromReadableStream(getRSCStream()).then((payload: RSCPayload) => {
  React.startTransition(() => {
    hydrateRoot(
      document,
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(RSCHydratedRouter, {
          createFromReadableStream,
          payload,
        }),
      ),
    );
  });
});
