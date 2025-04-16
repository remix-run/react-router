import type { ServerRouteObject } from "react-router/server";

export const routes = [
  {
    id: "root",
    path: "",
    // requiredCSS: ["/index.css"],
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
