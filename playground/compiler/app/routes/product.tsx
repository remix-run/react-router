import type { DefaultProps, LoaderArgs } from "./+types.product";

export function loader({ params }: LoaderArgs) {
  return { name: `Super cool product #${params.id}` };
}

export default function Component({ loaderData }: DefaultProps) {
  return <h1>{loaderData.name}</h1>;
}
