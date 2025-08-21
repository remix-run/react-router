import { Outlet, unstable_createContext } from "react-router";
import type { Route } from "./+types/client.a.b";
import { aContext, bContext, rootContext } from "~/contexts";

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start b middleware");
    context.set(bContext, "B");
    await next();
    console.log("end b middleware");
  },
];

export async function clientLoader({ context }: Route.ClientLoaderArgs) {
  await new Promise((r) => setTimeout(r, 200));
  return JSON.stringify({
    root: context.get(rootContext),
    a: context.get(aContext),
    b: context.get(bContext),
  });
}

export default function B({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h2>B</h2>
      <p>{loaderData}</p>
      <Outlet />
    </>
  );
}
