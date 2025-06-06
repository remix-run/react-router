"use client";

import { useFetcher } from "react-router";
import type { loader } from "../resource/resource";

export default function FetcherRoute() {
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
