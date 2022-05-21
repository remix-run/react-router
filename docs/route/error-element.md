---
title: errorElement
new: true
---

# `errorElement`

When dealing with external data, you can't always plan on it being found, the user having access to it, or the service even being up!

Here's a simple "not found" case:

```tsx [4,7-9]
<Route
  path="/properties/:id"
  element={<PropertyForSale />}
  errorElement={<PropertyError />}
  loader={async ({ params }) => {
    const res = await fetch(`/api/properties/${params.id}`);
    if (res.status === 404) {
      throw new Response("Not Found", { status: 404 });
    }
    const home = res.json();
    const descriptionHtml = parseMarkdown(
      data.descriptionMarkdown
    );
    return { home, descriptionHtml };
  }}
/>
```

As soon as you know you can't render the route with the data your'e loading, you can throw to break the call stack. You don't have to worry about the rest of the work in the loader like parsing the user's markdown bio when it doesn't exist.

React Router will catch the response and render the `errorElement` instead. This keeps your route components super clean because they don't have to worry about exceptions.

Here is a full example showing how you can create utility functions that throw responses to stop code execution in the loader and move over to an alternative UI.

```ts filename=app/db.ts
import { json } from "@remix-run/{runtime}";
import type { ThrownResponse } from "@remix-run/react";

export type InvoiceNotFoundResponse = ThrownResponse<
  404,
  string
>;

export function getInvoice(id, user) {
  const invoice = db.invoice.find({ where: { id } });
  if (invoice === null) {
    throw json("Not Found", { status: 404 });
  }
  return invoice;
}
```

```ts filename=app/http.ts
import { redirect } from "@remix-run/{runtime}";

import { getSession } from "./session";

export async function requireUserSession(request) {
  const session = await getSession(
    request.headers.get("cookie")
  );
  if (!session) {
    // can throw our helpers like `redirect` and `json` because they
    // return responses.
    throw redirect("/login", 302);
  }
  return session.get("user");
}
```

```tsx filename=app/routes/invoice/$invoiceId.tsx
import { useCatch, useLoaderData } from "@remix-run/react";
import type { ThrownResponse } from "@remix-run/react";

import { requireUserSession } from "~/http";
import { getInvoice } from "~/db";
import type {
  Invoice,
  InvoiceNotFoundResponse,
} from "~/db";

type InvoiceCatchData = {
  invoiceOwnerEmail: string;
};

type ThrownResponses =
  | InvoiceNotFoundResponse
  | ThrownResponse<401, InvoiceCatchData>;

export const loader = async ({ request, params }) => {
  const user = await requireUserSession(request);
  const invoice: Invoice = getInvoice(params.invoiceId);

  if (!invoice.userIds.includes(user.id)) {
    const data: InvoiceCatchData = {
      invoiceOwnerEmail: invoice.owner.email,
    };
    throw json(data, { status: 401 });
  }

  return json(invoice);
};

export default function InvoiceRoute() {
  const invoice = useLoaderData<Invoice>();
  return <InvoiceView invoice={invoice} />;
}

export function CatchBoundary() {
  // this returns { status, statusText, data }
  const caught = useCatch<ThrownResponses>();

  switch (caught.status) {
    case 401:
      return (
        <div>
          <p>You don't have access to this invoice.</p>
          <p>
            Contact {caught.data.invoiceOwnerEmail} to get
            access
          </p>
        </div>
      );
    case 404:
      return <div>Invoice not found!</div>;
  }

  // You could also `throw new Error("Unknown status in catch boundary")`.
  // This will be caught by the closest `ErrorBoundary`.
  return (
    <div>
      Something went wrong: {caught.status}{" "}
      {caught.statusText}
    </div>
  );
}
```
