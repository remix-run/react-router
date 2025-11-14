import type { Route } from "./+types/_index";

export async function loader({ params }: Route.LoaderArgs) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { planet: "world", date: new Date(), fn: () => 1 };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return <h1>Hello, {loaderData.planet}!</h1>;
}
