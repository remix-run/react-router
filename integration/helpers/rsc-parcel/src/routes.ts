import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

export const routes = [
  {
    id: "root",
    path: "",
    lazy: () => import("./routes/root"),
    children: [
      {
        id: "home",
        index: true,
        lazy: () => import("./routes/home"),
      },
    ],
  },
] satisfies RSCRouteConfig;
