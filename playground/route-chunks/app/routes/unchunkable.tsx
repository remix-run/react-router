import { useLoaderData } from "react-router";

// Dummy variable to prevent route exports from being chunked
let shared: null = null;

export const clientLoader = () => {
  return shared ?? "Hello from unchunkable client loader";
};

export default function Hello() {
  const message = useLoaderData() as Awaited<ReturnType<typeof clientLoader>>;
  return <div>{shared ?? message}</div>;
}
