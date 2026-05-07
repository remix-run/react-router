import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_viteEnvironmentApi: true,
    unstable_previewServerPrerendering: true,
  },
  prerender: ["/static"],
} satisfies Config;
