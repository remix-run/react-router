"use client-entry";

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
// @ts-expect-error
import { createFromReadableStream } from "react-server-dom-parcel/client";

import {
  type ServerPayload,
  getServerStream,
  ServerBrowserRouter,
} from "react-router";

createFromReadableStream(
  getServerStream(),
  { assets: "manifest" },
  {
    temporaryReferences: {
      clientId: () => <div>Client ID</div>,
    },
  }
).then((payload: ServerPayload) => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <ServerBrowserRouter
          decode={(payload) => createFromReadableStream(payload, manifest)}
          payload={payload}
        />
      </StrictMode>
    );
  });
});
