export { clientLoader } from "./home.client";

import { Counter } from "../../counter";

export function loader() {
  return {
    message: "Hello Home!" + "!".repeat(Math.floor(Math.random() * 10)),
  };
}

export default function Home({
  loaderData: { message },
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const logOnServer = () => {
    "use server";
    console.log(message);
  };

  return (
    <main>
      <h1>{message}</h1>
      <Counter />
      <form action={logOnServer as any}>
        <button type="submit">Log on server</button>
      </form>
    </main>
  );
}
