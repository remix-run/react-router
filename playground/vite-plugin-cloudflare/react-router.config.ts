import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_previewServerPrerendering: true,
  },
  prerender: ["/static"],
} satisfies Config;
