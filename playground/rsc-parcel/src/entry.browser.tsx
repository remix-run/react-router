"use client-entry";

import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_createCallServer as createCallServer,
  unstable_getServerStream as getServerStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import type { unstable_ServerPayload as ServerPayload } from "react-router";
import {
  createFromReadableStream,
  encodeReply,
  setServerCallback,
  // @ts-expect-error
} from "react-server-dom-parcel/client";

setServerCallback(
  createCallServer({
    createFromReadableStream,
    encodeReply,
  })
);

createFromReadableStream(getServerStream(), { assets: "manifest" }).then(
  (payload: ServerPayload) => {
    React.startTransition(() => {
      hydrateRoot(
        document,
        <React.StrictMode>
          <RSCHydratedRouter
            payload={payload}
            routeDiscovery="eager"
            createFromReadableStream={createFromReadableStream}
          />
        </React.StrictMode>
      );
    });
  }
);
