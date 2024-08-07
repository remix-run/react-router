import { useLoaderData } from "react-router";
import { clientLoader } from "./clientLoader";
export { clientLoader } from "./clientLoader";

export default function Hello() {
  const message = useLoaderData() as Awaited<ReturnType<typeof clientLoader>>;
  return <div>{message}</div>;
}
