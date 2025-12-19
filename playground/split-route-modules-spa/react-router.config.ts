import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  future: {
    v8_splitRouteModules: true,
  },
} satisfies Config;
