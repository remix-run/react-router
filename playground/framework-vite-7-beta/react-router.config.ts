import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_subResourceIntegrity: true,
    unstable_optimizeDeps: true,
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
