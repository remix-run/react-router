import type { Route } from "./+types/_index";

export function loader({ params }: Route.LoaderArgs) {
  return { planet: "world", date: new Date(), fn: () => 1 };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return <h1>Hello, {loaderData.planet}!</h1>;
}
