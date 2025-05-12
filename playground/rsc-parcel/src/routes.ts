import type { ServerRouteObject } from "react-router/rsc";

export const routes = [
  {
    id: "root",
    lazy: () => import("./routes/root/root"),
    children: [
      {
        id: "home",
        index: true,
        // @ts-expect-error
        lazy: () => import("./routes/home/home"),
      },
      {
        id: "about",
        path: "about",
        // @ts-expect-error
        lazy: () => import("./routes/about/about"),
      },
    ],
  },
] satisfies ServerRouteObject[];
