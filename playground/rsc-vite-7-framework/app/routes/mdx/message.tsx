import { useLoaderData } from "react-router";

export function Message() {
  const { message } = useLoaderData();
  return <div>Loader data: {message}</div>;
}
