import { data } from "react-router";

export {
  ErrorBoundary,
  // clientLazy,
  clientLoader,
  clientAction,
  default,
} from "./about.client";

export async function action() {
  // throw new Error("oops");
  // throw data("This is a test error", 404);
  await new Promise((r) => setTimeout(r, 500));
  return {
    message: `About route action ran at ${new Date().toISOString()}`,
  };
}

export async function loader() {
  // throw new Error("oops");
  // throw data("This is a test error", 404);
  await new Promise((r) => setTimeout(r, 500));
  return {
    message: `About route loader ran at ${new Date().toISOString()}`,
  };
}
