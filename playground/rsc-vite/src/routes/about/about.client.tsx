"use client";

import {
  type ClientLoaderFunctionArgs,
  useLoaderData,
  useRouteError,
  Form,
  useActionData,
  type ClientActionFunctionArgs,
  isRouteErrorResponse,
} from "react-router";

import { Counter } from "../../counter";

import type { action, loader } from "./about";

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

export function Component() {
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
  let error = useRouteError();
  return (
    <>
      <h1>Oooops</h1>
      {isRouteErrorResponse(error) ? (
        <p>
          {error.status} {error.statusText} {error.data}
        </p>
      ) : (
        <p>{String(error)}</p>
      )}
    </>
  );
}
