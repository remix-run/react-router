import * as React from "react";
import { Await, Outlet } from "react-router";

import type { Route } from "./+types/transitions.parent";

export async function loader() {
  await new Promise((r) => setTimeout(r, 1000));
  let promise = new Promise((r) => setTimeout(() => r("PARENT DATA"), 1000));
  return { promise };
}

export default function Transitions({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h2>Parent</h2>
      <React.Suspense fallback={<p>Loading parent data...</p>}>
        <Await resolve={loaderData.promise}>
          {(data) => <p>Data: {data}</p>}
        </Await>
        <Outlet />
      </React.Suspense>
    </>
  );
}
