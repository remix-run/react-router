import * as React from "react";
import { Await, Outlet } from "react-router";

import type { Route } from "./+types/transitions.parent.child";

export async function loader() {
  await new Promise((r) => setTimeout(r, 1000));
  let promise = new Promise((r) => setTimeout(() => r("CHILD DATA"), 2000));
  return { promise };
}

export default function Transitions({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h3>Child</h3>
      <Await resolve={loaderData.promise}>
        {(data) => <p>Data: {data}</p>}
      </Await>
    </>
  );
}
