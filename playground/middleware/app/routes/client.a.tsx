import { Outlet } from "react-router";
import type { Route } from "./+types/client.a";
import { aContext, rootContext } from "~/contexts";

export const unstable_clientMiddleware: Route.unstable_ClientMiddlewareFunction[] =
  [
    async ({ context }, next) => {
      console.log("start a middleware");
      context.set(aContext, "A");
      await next();
      console.log("end a middleware");
    },
  ];

export function clientLoader({ context }: Route.ClientLoaderArgs) {
  return JSON.stringify({
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
