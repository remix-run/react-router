"use client";

import { useFetcher } from "react-router";
import type { action } from "../resource/resource";

export default function FetcherRoute() {
  const fetcher = useFetcher<typeof action>();

  return (
    <main>
      <button
        onClick={() =>
          fetcher.submit(
            { hello: "world" },
            { action: "/resource", method: "post", encType: "application/json" }
          )
        }
      >
        Load fetcher data
      </button>
      <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>
    </main>
  );
}
