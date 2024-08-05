import { useLoaderData } from "react-router";

export const clientLoader = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "hello from unchunkable client loader!";
};

export default function Hello() {
  const message = useLoaderData() as Awaited<ReturnType<typeof clientLoader>>;
  return <div>{message}</div>;
}
