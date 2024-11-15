---
"@react-router/dev": major
---

For Remix consumers migrating to React Router, the Vite plugin's `manifest` option has been removed.

The `manifest` option been superseded by the more powerful `buildEnd` hook since it's passed the `buildManifest` argument. You can still write the build manifest to disk if needed, but you'll most likely find it more convenient to write any logic depending on the build manifest within the `buildEnd` hook itself.

If you were using the `manifest` option, you can replace it with a `buildEnd` hook that writes the manifest to disk like this:

```ts
// react-router.config.ts
import type { Config } from "@react-router/dev/config";
import { writeFile } from "node:fs/promises";

export default {
  async buildEnd({ buildManifest }) {
    await writeFile(
      "build/manifest.json",
      JSON.stringify(buildManifest, null, 2),
      "utf-8"
    );
  },
} satisfies Config;
```
