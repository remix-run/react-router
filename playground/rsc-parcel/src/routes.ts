import type { ServerRouteObject } from "react-router";

import * as home from "./routes/home/home";
import * as root from "./routes/root/root";

export const routes = [
  {
    id: "root",
    ...root,
    children: [
      {
        id: "home",
        index: true,
        ...home,
      },
    ],
  },
] satisfies ServerRouteObject[];
