import { Outlet } from "react-router";
import type { Route } from "./+types/server.a";

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start a middleware");
    context.a = "A";
    let res = await next();
    console.log("end a middleware");
    return res;
  },
];

export function loader({ context }: Route.LoaderArgs) {
  return JSON.stringify(context);
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
