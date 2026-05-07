import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  prerender: ["/", "/server-loader"],
  future: {
    v8_splitRouteModules: "enforce"
  }
} satisfies Config;
