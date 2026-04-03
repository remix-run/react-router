import type { Route } from "./+types/product";

export function loader({ params }: Route.LoaderArgs) {
  return { name: `Super cool product #${params.id}` };
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  let data = await serverLoader();
  await new Promise((r) => setTimeout(r, 1000));
  return { name: data.name + " (mutated)" };
}

clientLoader.unstable_batch = true;

export default function Component({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.name}</h1>;
}
