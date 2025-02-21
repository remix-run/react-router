import type { ServerRouteObject } from "react-router";

export const routes = [
  {
    id: "root",
    lazy: () => import("./routes/root/root"),
    children: [
      {
        id: "home",
        index: true,
        lazy: () => import("./routes/home/home"),
      },
      {
        id: "about",
        path: "about",
        lazy: () => import("./routes/about/about"),
      },
    ],
  },
] satisfies ServerRouteObject[];
