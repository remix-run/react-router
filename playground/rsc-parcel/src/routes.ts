import type { unstable_ServerRouteObject as ServerRouteObject } from "react-router/rsc";

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
      {
        id: "fetcher",
        path: "fetcher",
        lazy: () => import("./routes/fetcher/fetcher"),
      },
    ],
  },
  {
    id: "resource",
    path: "resource",
    lazy: () => import("./routes/resource/resource"),
  },
] satisfies ServerRouteObject[];
