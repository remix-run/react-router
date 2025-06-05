"use client";

import { useFetcher } from "react-router";
import type { loader } from "../resource/resource";

export function Component() {
  const fetcher = useFetcher<typeof loader>();

  return (
    <main>
      <button onClick={() => fetcher.load("/resource")}>
        Load fetcher data
      </button>
      <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>
    </main>
  );
}
