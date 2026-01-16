import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_subResourceIntegrity: true,
  },
  ssr: true,
} satisfies Config;
