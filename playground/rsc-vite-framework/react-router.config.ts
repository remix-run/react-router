import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  prerender: ["/", "/server-loader"],
} satisfies Config;
