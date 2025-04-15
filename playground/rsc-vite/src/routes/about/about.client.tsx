"use client";

import {
  type ClientLoaderFunctionArgs,
  useLoaderData,
  useRouteError,
  Form,
  useActionData,
  type ClientActionFunctionArgs,
} from "react-router";

import { Counter } from "../../counter";

import type { action, loader } from "./about";

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

export async function clientAction({ serverAction }: ClientActionFunctionArgs) {
  console.log("action");
  let data = await serverAction<typeof action>();
  return {
    message: data.message + " (mutated by client)",
  };
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const res = await serverLoader<typeof loader>();
  return {
    message: res.message + " (mutated in clientLoader)",
  };
}

clientLoader.hydrate = true;

export default function About() {
  const loaderData = useLoaderData<typeof clientLoader>();
  const actionData = useActionData<typeof clientAction>();

  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <h2>About Route</h2>
      <p>Loader data: {loaderData.message}</p>
      <Counter />
      <Form method="post">
        <button type="submit">Submit</button>
        {actionData ? <p>{actionData.message}</p> : null}
      </Form>
    </div>
  );
}

export function ErrorBoundary() {
  console.log(useRouteError());
  return <h1>Oooops</h1>;
}
