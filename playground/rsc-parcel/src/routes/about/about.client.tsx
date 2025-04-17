"use client";

import { type ClientLoaderFunctionArgs, useLoaderData } from "react-router";

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
    client: true,
    ...res,
  };
}

export default function About() {
  const { client, message } = useLoaderData<typeof clientLoader>();

  return (
    <main>
      <h1>{message}</h1>
      <p>Did client loader run? {client ? "Yes" : "No"}</p>
      <Counter />
    </main>
  );
}
