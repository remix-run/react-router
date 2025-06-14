export { default, ErrorBoundary, Layout } from "./root.client";

import { Counter } from "../../counter";

export function loader() {
  return {
    counter: <Counter />,
    message: "Hello from the server!",
  };
}
