import * as React from "react";
// @ts-expect-error - no types yet
import { createFromReadableStream } from "@jacob-ebey/react-server-dom-vite/client";
import { hydrateRoot } from "react-dom/client";
// @ts-expect-error - no types yet
import { manifest } from "virtual:react-manifest";

import { api, callServer } from "./references.browser";
import type { UNSAFE_ServerPayload } from "./server";

function Shell({ payload }: { payload: Promise<UNSAFE_ServerPayload> }) {
  const [promise, setPayload] = React.useState(payload);
  const [_, startNavigation] = React.useTransition();

  const { root } = React.use(promise);

  api.updatePayload = React.useCallback<
    React.Dispatch<React.SetStateAction<Promise<UNSAFE_ServerPayload>>>
  >((payload) => {
    startNavigation(() => {
      setPayload(payload);
    });
  }, []);

  return root;
}

export async function hydrateApp(container: Element | Document = document) {
  const { rscStream } = await import("rsc-html-stream/client");
  const payload: Promise<UNSAFE_ServerPayload> = createFromReadableStream(
    rscStream,
    manifest,
    { callServer }
  );

  React.startTransition(async () => {
    hydrateRoot(
      container,
      <React.StrictMode>
        <Shell payload={payload} />
      </React.StrictMode>,
      {
        formState: (await payload).formState,
      }
    );
  });
}
