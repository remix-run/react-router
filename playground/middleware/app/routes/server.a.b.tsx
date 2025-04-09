import { Outlet, unstable_createContext } from "react-router";
import type { Route } from "./+types/server.a.b";
import { aContext, bContext, expressContext, rootContext } from "~/contexts";

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start b middleware");
    context.set(bContext, "B");
    let res = await next();
    console.log("end b middleware");
    return res;
  },
];

export async function loader({ context }: Route.LoaderArgs) {
  await new Promise((r) => setTimeout(r, 200));
  return JSON.stringify({
    express: context.get(expressContext),
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
