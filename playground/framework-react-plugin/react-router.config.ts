import type { Config } from "@react-router/dev/config";

export default {
  subResourceIntegrity: true,
  future: {
    unstable_externalReactPlugin: true,
    unstable_optimizeDeps: true,
  },
} satisfies Config;
