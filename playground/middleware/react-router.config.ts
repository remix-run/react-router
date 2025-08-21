import type { Config } from "@react-router/dev/config";

export default {
  future: {
    middleware: true,
    unstable_splitRouteModules: true,
  },
} satisfies Config;
