import { Outlet, unstable_createContext } from "react-router";
import type { Route } from "./+types/server.a";
import { aContext, expressContext, rootContext } from "~/contexts";

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start a middleware");
    context.set(aContext, "A");
    let res = await next();
    console.log("end a middleware");
    return res;
  },
];

export function loader({ context }: Route.LoaderArgs) {
  return JSON.stringify({
    express: context.get(expressContext),
    root: context.get(rootContext),
    a: context.get(aContext),
  });
}

export default function A({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>A</h1>
      <p>{loaderData}</p>
      <Outlet />
    </>
  );
}
