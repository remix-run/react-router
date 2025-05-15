import type { ServerRouteObject } from "react-router/rsc";

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
] satisfies ServerRouteObject[];
