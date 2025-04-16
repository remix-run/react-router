"use client";

import * as React from "react";
import { type ClientLoaderFunctionArgs, useLoaderData } from "react-router";

import { Counter } from "../../counter";

import type { loader } from "./home";

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const res = await serverLoader<typeof loader>();

  return {
    client: true,
    ...res,
  };
}

export default function Home() {
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

export function HomeForm({ fn }: { fn: () => unknown }) {
  const [state, formAction, isPending] = React.useActionState(fn, null);

  return (
    <form action={formAction}>
      <button type="submit">
        Log on server{isPending ? " (pending)" : null}
      </button>
      {state ? <p>Action state: {state}</p> : null}
    </form>
  );
}
