---
title: Webhooks
# can make a quick how-to on creating a webhook, this was copy/pasted from another doc, needs to be reviewed first
hidden: true
---

# Webhooks

Resource routes can be used to handle webhooks. For example, you can create a webhook that receives notifications from GitHub when a new commit is pushed to a repository:

```tsx
import type { Route } from "./+types/github";

import crypto from "node:crypto";

export const action = async ({
  request,
}: Route.ActionArgs) => {
  if (request.method !== "POST") {
    return Response.json(
      { message: "Method not allowed" },
      {
        status: 405,
      }
    );
  }
  const payload = await request.json();

  /* Validate the webhook */
  const signature = request.headers.get(
    "X-Hub-Signature-256"
  );
  const generatedSignature = `sha256=${crypto
    .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex")}`;
  if (signature !== generatedSignature) {
    return Response.json(
      { message: "Signature mismatch" },
      {
        status: 401,
      }
    );
  }

  /* process the webhook (e.g. enqueue a background job) */

  return Response.json({ success: true });
};
```
