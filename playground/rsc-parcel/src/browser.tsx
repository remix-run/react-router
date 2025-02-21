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

createFromReadableStream(getServerStream()).then((payload: ServerPayload) => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <ServerBrowserRouter
          decode={createFromReadableStream}
          payload={payload}
        />
      </StrictMode>
    );
  });
});
