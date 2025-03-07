export { clientLoader } from "./home.client";

export function loader() {
  return {
    message: "Hello Home!",
  };
}

export default function Home({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return <h1>{loaderData.message}</h1>;
}
