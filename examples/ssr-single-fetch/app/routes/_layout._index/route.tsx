import { useLoaderData } from "react-router-dom";

export function loader() {
  return {
    message: "This is a loader message.",
  };
}

export function Component() {
  const { message } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return (
    <main>
      <h1>Index</h1>
      <p>{message}</p>
    </main>
  );
}
