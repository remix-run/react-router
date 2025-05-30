import { HomeForm, RedirectForm } from "./home.client";
export { clientLoader } from "./home.client";

import { Counter } from "../../counter";
import { redirect } from "react-router/rsc";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  await new Promise((r) => setTimeout(r, 500));
  return {
    message: `Home route loader ran at ${new Date().toISOString()}`,
    wasRedirected:
      new URL(request.url).searchParams.get("redirected") === "true",
  };
}

export default function Home({
  loaderData: { message, wasRedirected },
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const logOnServer = async () => {
    "use server";
    await new Promise((r) => setTimeout(r, 500));
    console.log("Running action on server!");
    console.log(
      `  data to prove that scoped vars work: ${message} and it is now ${new Date().toISOString()}`
    );
    return new Date().toISOString();
  };

  const redirectOnServer = async () => {
    "use server";
    await new Promise((r) => setTimeout(r, 500));
    if (wasRedirected) {
      throw redirect("/");
    }
    throw redirect("/?redirected=true");
  };

  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <h2>Home Route</h2>
      <p>Loader data: {message}</p>
      <Counter />
      <HomeForm fn={logOnServer} />
      <RedirectForm fn={redirectOnServer} />
    </div>
  );
}
