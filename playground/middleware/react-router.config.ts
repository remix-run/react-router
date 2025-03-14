import type { Config } from "@react-router/dev/config";
import type { Future } from "react-router";

declare module "react-router" {
  interface Future {
    unstable_middleware: true;
  }
}

export default {
  future: {
    unstable_middleware: true,
    unstable_splitRouteModules: true,
  },
} satisfies Config;
