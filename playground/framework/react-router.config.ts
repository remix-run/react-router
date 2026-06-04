import type { Config } from "@react-router/dev/config";

export default {
  subResourceIntegrity: true,
  future: {
    unstable_optimizeDeps: true,
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
