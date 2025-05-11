import type { RouterProviderProps } from "react-router";
import { RouterProvider } from "react-router";

// TODO: Confirm if this causes tree-shaking issues and if so, convert to named exports
export type * from "react-router";
export * from "react-router";

export type { RouterProviderProps };
export { RouterProvider };
