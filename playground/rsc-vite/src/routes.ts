import type { unstable_ServerRouteObject as ServerRouteObject } from "react-router/rsc";

export const routes = [
  {
    id: "root",
    path: "",
    // @ts-expect-error
    lazy: () => import("./routes/root/root?vite-rsc-css-export=Layout"),
    children: [
      {
        id: "home",
        index: true,
        // @ts-expect-error
        lazy: () => import("./routes/home/home?vite-rsc-css-export=default"),
      },
      {
        id: "about",
        path: "about",
        // @ts-expect-error
        lazy: () => import("./routes/about/about"),
      },
      {
        id: "parent",
        path: "parent",
        lazy: () => import("./routes/parent/parent"),
        children: [
          {
            id: "parent-index",
            index: true,
            lazy: () => import("./routes/parent-index/parent-index"),
          },
          {
            id: "child",
            path: "child",
            // @ts-expect-error
            lazy: () => import("./routes/child/child"),
          },
        ],
      },
      {
        id: "redirect",
        path: "redirect",
        lazy: () => import("./routes/redirect"),
      },
    ],
  },
] satisfies ServerRouteObject[];
