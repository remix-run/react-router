import { HomeForm, RedirectForm } from "./home.client";
export { clientLoader } from "./home.client";

import { Counter } from "../../counter";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import "./home.css";

export async function loader({ request }: LoaderFunctionArgs) {
  await new Promise((r) => setTimeout(r, 500));
  return {
    message: `Home route loader ran at ${new Date().toISOString()}`,
    wasRedirected:
      new URL(request.url).searchParams.get("redirected") === "true",
  };
}

export default function HomeRoute({
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
    return <div>{new Date().toISOString()}</div>;
  };

  const redirectOnServer = async () => {
    "use server";
    await new Promise((r) => setTimeout(r, 500));
    if (wasRedirected) {
      redirect("/");
    } else {
      redirect("/?redirected=true");
    }
  };

  return (
    <div className="server-box-home">
      <h2>Home Route</h2>
      <p>Loader data: {message}</p>
      <Counter />
      <HomeForm fn={logOnServer} />
      <RedirectForm fn={redirectOnServer} />
    </div>
  );
}
