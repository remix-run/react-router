---
title: .client modules
---

# `.client` modules

[MODES: framework]

## Summary

You may have a file or dependency that uses module side effects in the browser. You can use `*.client.ts` on file names or nest files within `.client` directories to force them out of server bundles.

```ts filename=feature-check.client.ts
// this would break the server
export const supportsVibrationAPI =
  "vibrate" in window.navigator;
```

Note that values exported from this module will all be `undefined` on the server, so the only places to use them are in [`useEffect`][use_effect] and user events like click handlers.

```ts
import { supportsVibrationAPI } from "./feature-check.client.ts";

console.log(supportsVibrationAPI);
// server: undefined
// client: true | false
```

<docs-info>

If you need more sophisticated control over what is included in the client/server bundles, check out the [`vite-env-only` plugin](https://github.com/pcattori/vite-env-only).

</docs-info>

## Usage Patterns

### Individual Files

Mark individual files as client-only by adding `.client` to the filename:

```txt
app/
├── utils.client.ts        👈 client-only file
├── feature-detection.client.ts
└── root.tsx
```

### Client Directories

Mark entire directories as client-only by using `.client` in the directory name:

```txt
app/
├── .client/               👈 entire directory is client-only
│   ├── analytics.ts
│   ├── feature-detection.ts
│   └── browser-utils.ts
├── components/
└── root.tsx
```

## Examples

### Browser Feature Detection

```ts filename=app/utils/browser.client.ts
export const canUseDOM = typeof window !== "undefined";

export const hasWebGL = !!window.WebGLRenderingContext;

export const supportsVibrationAPI =
  "vibrate" in window.navigator;
```

### Client-Only Libraries

```ts filename=app/analytics.client.ts
// This would break on the server
import { track } from "some-browser-only-analytics-lib";

export function trackEvent(eventName: string, data: any) {
  track(eventName, data);
}
```

### Using Client Modules

```tsx filename=app/routes/dashboard.tsx
import { useEffect } from "react";
import {
  canUseDOM,
  supportsLocalStorage,
  supportsVibrationAPI,
} from "../utils/browser.client.ts";
import { trackEvent } from "../analytics.client.ts";

export default function Dashboard() {
  useEffect(() => {
    // These values are undefined on the server
    if (canUseDOM && supportsVibrationAPI) {
      console.log("Device supports vibration");
    }

    // Safe localStorage usage
    const savedTheme =
      supportsLocalStorage.getItem("theme");
    if (savedTheme) {
      document.body.className = savedTheme;
    }

    trackEvent("dashboard_viewed", {
      timestamp: Date.now(),
    });
  }, []);

  return <div>Dashboard</div>;
}
```

[use_effect]: https://react.dev/reference/react/useEffect
