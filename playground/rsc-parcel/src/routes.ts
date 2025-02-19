"use server-entry";

import "./browser";

import type { ServerRouteObject } from "react-router";

import * as home from "./routes/home/home";
import * as root from "./routes/root/root";

export function routes(): ServerRouteObject[] {
  return [
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
  ];
}
