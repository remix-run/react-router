import process from "node:process";

import { server } from "./msw";

server.listen({ onUnhandledRequest: "error" });

process.on("exit", () => {
  server.close();
});
