"use client";

import { type ClientLoaderFunctionArgs, useLoaderData } from "react-router";

import { Counter } from "../../counter";

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const res = await serverLoader<typeof import("./home").loader>();

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
