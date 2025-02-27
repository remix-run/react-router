import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
// @ts-expect-error - no types
import { createFromReadableStream } from "@jacob-ebey/react-server-dom-vite/client";
// @ts-expect-error - no types yet
import { manifest } from "virtual:react-manifest";

import {
  type ServerPayload,
  getServerStream,
  ServerBrowserRouter,
} from "react-router";

createFromReadableStream(getServerStream(), manifest).then(
  (payload: ServerPayload) => {
    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <ServerBrowserRouter
            decode={(body) => createFromReadableStream(body, manifest)}
            payload={payload}
          />
        </StrictMode>
      );
    });
  }
);
