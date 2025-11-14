import { useFetcher } from "react-router";
import type { Route } from "./+types/product";

export function loader({ params }: Route.LoaderArgs) {
  return { name: `Super cool product #${params.id}` };
}

export default function Component({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();

  return (
    <>
      <h1>{loaderData.name}</h1>
      <button onClick={() => fetcher.load("/products/fetcher")}>
        Load via Fetcher
      </button>
      {fetcher.data && <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>}
    </>
  );
}
