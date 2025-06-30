import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

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
] satisfies RSCRouteConfig;
