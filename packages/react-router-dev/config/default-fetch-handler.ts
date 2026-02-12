import { createRequestHandler } from "react-router";

const handler = createRequestHandler(
  // @ts-expect-error - no types for this
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request) {
    return handler(request);
  },
};
