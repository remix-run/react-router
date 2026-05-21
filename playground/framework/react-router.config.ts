import type { Config } from "@react-router/dev/config";

export default {
  subResourceIntegrity: true,
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
