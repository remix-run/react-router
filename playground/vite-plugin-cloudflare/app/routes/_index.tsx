import type { MetaFunction } from "react-router";
import type { Route } from "./+types/_index"

export const meta: MetaFunction = () => {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

export async function loader({ context }: Route.LoaderArgs) {
  return {
    message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE,
  };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to React Router</h1>
      <p>{loaderData.message}</p>
    </div>
  );
}
