import type { ServerRouteObject } from "react-router";

// import * as home from "./routes/home/home";
// import * as root from "./routes/root/root";

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
    ],
  },
] satisfies ServerRouteObject[];
