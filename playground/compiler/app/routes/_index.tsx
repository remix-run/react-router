import { DefaultProps, LoaderArgs } from "./+types._index";

export function loader({ params }: LoaderArgs) {
  return { planet: "world", date: new Date(), fn: () => 1 };
}

export default function Index({ loaderData }: DefaultProps) {
  return <h1>Hello, {loaderData.planet}!</h1>;
}
