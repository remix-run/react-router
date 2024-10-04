import { useLoaderData } from "react-router";

export const clientLoader = () => {
  return "Hello from chunkable client loader";
};

export default function Hello() {
  const message = useLoaderData() as Awaited<ReturnType<typeof clientLoader>>;
  return <div>{message}</div>;
}
