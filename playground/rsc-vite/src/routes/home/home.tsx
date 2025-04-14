export { clientLoader } from "./home.client";

import { Counter } from "../../counter";

export function loader() {
  return {
    message: `Home route loader ran at ${new Date().toISOString()}`,
  };
}

export default function Home({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const logOnServer = () => {
    "use server";
    console.log("Running action on server!");
    console.log(
      `  loader data to prove that scoped vars work: ${loaderData.message}`
    );
  };

  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <h2>Home Route</h2>
      <p>Loader data: {loaderData.message}</p>
      <Counter />
      <form action={logOnServer as any}>
        <button type="submit">Log on server</button>
      </form>
    </div>
  );
}
