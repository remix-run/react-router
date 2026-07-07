import type { Config } from "@react-router/dev/config";

export default {
  subResourceIntegrity: true,
  future: {
    unstable_optimizeDeps: true,
    unstable_traverseCache: true,
  },
} satisfies Config;
