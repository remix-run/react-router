import { RouterProvider } from "react-router-dom";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import RSD from "react-server-dom-diy/client";

export default function start() {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RouterProvider />
      </StrictMode>
    );
  });
}

export function createFromReadableStream(body: ReadableStream<Uint8Array>) {
  return RSD.createFromReadableStream(body);
}
