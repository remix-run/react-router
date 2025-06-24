import type { unstable_ServerRouteObject as ServerRouteObject } from "react-router";

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
