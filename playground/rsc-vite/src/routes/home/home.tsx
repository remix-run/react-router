import { HomeForm } from "./home.client";
export { clientLoader } from "./home.client";

import { Counter } from "../../counter";

export async function loader() {
  await new Promise((r) => setTimeout(r, 500));
  return {
    message: `Home route loader ran at ${new Date().toISOString()}`,
  };
}

export default function Home({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const logOnServer = async () => {
    "use server";
    await new Promise((r) => setTimeout(r, 500));
    console.log("Running action on server!");
    console.log(`  data to prove that scoped vars work: ${loaderData.message}`);
    return new Date().toISOString();
  };

  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <h2>Home Route</h2>
      <p>Loader data: {loaderData.message}</p>
      <Counter />
      <HomeForm fn={logOnServer} />
    </div>
  );
}
