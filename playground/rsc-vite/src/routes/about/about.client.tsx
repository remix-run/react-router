"use client";

import {
  type ClientLoaderFunctionArgs,
  useLoaderData,
  useRouteError,
} from "react-router";

import { Counter } from "../../counter";

import type { loader } from "./about";

// TODO: Investigate using lazy as a preload method for split route chunk modules
// export function lazy() {
//   import("./about.client.tsx?route-chunk=clientLoader");
//   import("./about.client.tsx?route-chunk=clientAction");
//   return {};
// }
// export async function clientLoader(...args) {
//   return import("./about.client.tsx?route-chunk=clientLoader").then((mod) =>
//     mod.clientLoader(...args)
//   );
// }

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const res = await serverLoader<typeof loader>();

  return {
    message: res.message + " (mutated in clientLoader)",
  };
}

export default function About() {
  const loaderData = useLoaderData<typeof clientLoader>();

  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <h2>About Route</h2>
      <p>Loader data: {loaderData.message}</p>
      <Counter />
    </div>
  );
}

export function ErrorBoundary() {
  console.log(useRouteError());
  return <h1>Oooops</h1>;
}
