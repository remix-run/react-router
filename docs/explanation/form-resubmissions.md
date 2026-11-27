---
title: Form Resubmissions
---

# Form Resubmissions

[MODES: framework, data]

<br/>
<br/>

There are two kinds of form resubmission to consider: replaying a submission from browser history and submitting again while an earlier request is still pending. React Router handles them differently.

## Client-Side Submissions

After JavaScript loads, [`<Form>`][form] prevents the browser's document submission and sends the mutation through React Router. The mutation request itself is not stored as a `POST` entry in browser history. React Router stores the destination URL as a client-side location, so visiting it with the back or forward button—or refreshing it—performs normal data loading instead of running the `action` again.

This also applies to navigations started with [`useSubmit`][use-submit]. A [`fetcher`][use-fetcher] submission does not create a history entry at all.

## Document Submissions

When the browser handles the submission, its normal document-navigation behavior applies. This happens with a native `<form>`, `<Form reloadDocument>`, or a progressively enhanced `<Form>` submitted before JavaScript loads. If an `action` renders a response to a `POST` directly, revisiting that history entry may prompt the browser to resend the form data.

Use the Post/Redirect/Get pattern for successful document submissions: return a [`redirect`][redirect] from the `action`, and the browser follows it with a `GET`. The resulting history entry can then be revisited without repeating the mutation. This keeps the document and client-side submission paths consistent.

## Submitting While Pending

Submitting again while a request is pending is a new submission, not a history replay. React Router interrupts stale navigation requests and coordinates concurrent fetcher submissions; see [Network Concurrency Management][network-concurrency] for the exact behavior and the remaining server-side race-condition considerations.

Use [pending UI][pending-ui] to show that work is in progress and to prevent accidental repeat interactions when appropriate. For mutations that must run at most once, such as payments, also enforce that constraint on the server because canceling a browser request cannot guarantee that it did not reach the server.

## Data Revalidation

After a successful `action`, React Router automatically revalidates eligible loader data so the UI reflects the mutation. An `action` response with a `4xx` or `5xx` status skips normal automatic revalidation, which is useful when returning validation errors; see [Form Validation][form-validation].

If reloading every eligible route is unnecessary, follow [Revalidation Optimization][revalidation-optimization]. Opting out incorrectly can leave the UI out of sync with server data, so keep the default behavior unless the route can safely make that decision.

[form]: ../api/components/Form
[form-validation]: ../how-to/form-validation
[network-concurrency]: ./concurrency
[pending-ui]: ../start/framework/pending-ui
[redirect]: ../api/utils/redirect
[revalidation-optimization]: ../how-to/optimize-revalidation
[use-fetcher]: ../api/hooks/useFetcher
[use-submit]: ../api/hooks/useSubmit
