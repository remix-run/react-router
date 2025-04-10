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
    client: true,
    ...res,
  };
}

export default function About() {
  const { client, message } = useLoaderData<typeof clientLoader>();

  return (
    <main>
      <h1>
        {message} {String(client)}
      </h1>
      <Counter />
    </main>
  );
}

export function ErrorBoundary() {
  console.log(useRouteError());
  return <h1>Oooops</h1>;
}
