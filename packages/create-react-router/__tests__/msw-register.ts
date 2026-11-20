import process from "node:process";

import { server } from "./msw.ts";

server.listen({ onUnhandledRequest: "error" });

process.on("exit", () => {
  server.close();
});
