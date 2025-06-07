"use client";

import { type ClientLoaderFunctionArgs, useLoaderData } from "react-router";

import { Counter } from "../../counter";

import type { loader } from "./home";
import { redirectAction } from "./home.actions";

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const res = await serverLoader<typeof loader>();

  return {
    client: true,
    ...res,
  };
}

export default function HomeRoute() {
  const { client, message } = useLoaderData<typeof clientLoader>();

  return (
    <main>
      <h1>{message}</h1>
      <p>Did client loader run? {client ? "Yes" : "No"}</p>
      <Counter />
      <form action={redirectAction}>
        <button type="submit" data-submit>
          Redirect via Server Function
        </button>
      </form>
    </main>
  );
}
