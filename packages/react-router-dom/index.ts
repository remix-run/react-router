import type { RouterProviderProps } from "react-router/dom";
import { HydratedRouter, RouterProvider } from "react-router/dom";

// TODO: Confirm if this causes tree-shaking issues and if so, convert to named exports
export type * from "react-router";
export * from "react-router";

export type { RouterProviderProps };
export { HydratedRouter, RouterProvider };
