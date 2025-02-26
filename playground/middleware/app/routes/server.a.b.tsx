import { Outlet, unstable_createContext } from "react-router";
import type { Route } from "./+types/server.a.b";
import { rootContext } from "~/root";
import { aContext } from "./server.a";

export const bContext = unstable_createContext<string>();

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start b middleware");
    context.set(bContext, "B");
    let res = await next();
    console.log("end b middleware");
    return res;
  },
];

export function loader({ context }: Route.LoaderArgs) {
  return JSON.stringify({
    root: context.get(rootContext),
    a: context.get(aContext),
    b: context.get(bContext),
  });
}

export default function A({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h2>B</h2>
      <p>{loaderData}</p>
      <Outlet />
    </>
  );
}
