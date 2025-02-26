import { Outlet } from "react-router";
import type { Route } from "./+types/server.a.b";

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start b middleware");
    context.b = "B";
    let res = await next();
    console.log("end b middleware");
    return res;
  },
];

export function loader({ context }: Route.LoaderArgs) {
  return JSON.stringify(context);
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
