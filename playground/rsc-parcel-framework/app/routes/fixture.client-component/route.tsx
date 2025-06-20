import { Route } from "./+types/route";

export function loader() {
  return {
    message: <p>From the loader.</p>,
  };
}

export default function ClientComponent({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>Client Component</h1>
      {loaderData.message}
    </div>
  );
}
