import { data } from "react-router";

export {
  ErrorBoundary,
  // clientLazy,
  clientLoader,
  default,
} from "./about.client";

export function loader() {
  // throw new Error("oops");
  // throw data("This is a test error", 404);
  return {
    message: `About route loader ran at ${new Date().toISOString()}`,
  };
}
