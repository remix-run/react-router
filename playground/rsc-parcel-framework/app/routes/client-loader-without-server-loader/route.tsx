import { Route } from "./+types/route.js";

export function clientLoader() {
  return "hello, world from client loader";
}

export default function ClientLoaderWithoutServerLoaderRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <main>
      <h1>Client loader without server loader</h1>
      <p>Loader data: {loaderData}</p>
    </main>
  );
}
