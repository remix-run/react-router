import { useLoaderData } from "react-router";

// Dummy variable to prevent route exports from being split
let shared: null = null;

export const clientLoader = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return shared ?? "Hello from splittable client loader";
};

export default function Hello() {
  const message = useLoaderData() as Awaited<ReturnType<typeof clientLoader>>;
  return shared ?? <div>{message}</div>;
}
