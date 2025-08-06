import { Route } from "./+types/route";

export function loader() {
  return {
    message: <p key="loader">From the loader.</p>,
  };
}

export async function ServerComponent({ loaderData }: Route.ComponentProps) {
  const message = await Promise.resolve("From the component.");
  return (
    <div>
      <h1>Client Component</h1>
      {loaderData.message}
      {message}
    </div>
  );
}
