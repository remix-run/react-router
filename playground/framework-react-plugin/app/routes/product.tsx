import type { Route } from "./+types/product";

export function loader({ params }: Route.LoaderArgs) {
  return { name: `Super cool product #${params.id}` };
}

export default function Component({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.name}</h1>;
}
