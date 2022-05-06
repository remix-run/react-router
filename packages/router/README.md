# Router

The `@remix-run/router` package is the heart of [React Router](https://github.com/remix-run/react-router) and provides all the core functionality for routing, data loading, data mutations,
and transitions.

If you're using React Router, you should never `import` anything directly from
the `@remix-run/router` or `react-router` packages, but you should have everything
you need in either `react-router-dom` or `react-router-native`. Both of those
packages re-export everything from `@remix-run/router` and `react-router`.

## API

A Router instance can be created using `createRouter`:

```js
let router = createRouter({
  // Routes array using react-router RouteObject's
  routes,
  // History instance
  history,
  // Callback function executed on every state change
  onChange: (state) => { ... },
  // Optional hydration data for SSR apps
  hydrationData?: HydrationState;
}
```

Internally, the Router represents the state in an object of the following format, which is available through `router.state` or via the `onChange` callback function:

```ts
interface RouterState {
  // The `history` action of the most recently completed navigation
  action: Action;
  // The current location of the router.  During a transition this reflects
  // the "old" location and is updated upon completion of the navigation
  location: Location;
  // The current set of route matches
  matches: RouteMatch[];
  // The state of the current transition
  transition: Transition;
  // Data from the loaders for the current matches
  loaderData: RouteData;
  // Data from the action for the current matches
  actionData: RouteData | null;
  // Errors thrown from loaders/actions for the current matches
  errors: RouteData | null;
}
```

### Navigations

All navigations are done through the `router.navigate` API which is overloaded to support different types of navigations:

```js
// Link navigation (pushes onto the history stack by default)
router.navigate('/page');

// Link navigation (replacing the history stack)
router.navigate('/page', { replace: true });

// Pop navigation (moving backward/forward in the history stack)
router.navigate(-1);

// Form navigation
router.navigate('/page', {
  formMethod: 'GET',
  formData: new FormData(...),
});
```

## Transition Flows

Each navigation (link click or form submission) in the Router is reflected via an internal `state.transition` that indicates the state of the navigation. This concept of a `transition` is a complex and heavily async bit of logic that is foundational to the Router's ability to manage data loading, submission, error handling, redirects, interruptions, and so on. Due to the user-driven nature of interruptions we don't quite believe it can be modeled as a finite state machine, however we have modeled some of the happy path flows below for clarity.

_Note: This does not depict error or interruption flows._

```mermaid
graph LR
  %% Link click
  idle -->|link clicked| loading/normalLoad
  subgraph "&lt;Link&gt; click"
  loading/normalLoad -->|loader redirected| loading/normalRedirect
  loading/normalRedirect --> loading/normalRedirect
  end
  loading/normalLoad -->|loaders completed| idle
  loading/normalRedirect -->|loaders completed| idle

  %% Form method=get
  idle -->|form method=get| submitting/loaderSubmission
  subgraph "&lt;Form method=get&gt;"
  submitting/loaderSubmission -->|loader redirected| R1[loading/submissionRedirect]
  R1[loading/submissionRedirect] --> R1[loading/submissionRedirect]
  end
  submitting/loaderSubmission -->|loaders completed| idle
  R1[loading/submissionRedirect] -->|loaders completed| idle

  %% Form method=post
  idle -->|form method=post| submitting/actionSubmission
  subgraph "&lt;Form method=post&gt;"
  submitting/actionSubmission -->|action returned| loading/actionReload
  submitting/actionSubmission -->|action redirected| R2[loading/submissionRedirect]
  loading/actionReload -->|loader redirected| R2[loading/submissionRedirect]
  R2[loading/submissionRedirect] --> R2[loading/submissionRedirect]
  end
  loading/actionReload -->|loaders completed| idle
  R2[loading/submissionRedirect] -->|loaders completed| idle

  idle -->|fetcher action redirect| R3[loading/submissionRedirect]
  subgraph "Fetcher action redirect"
  R3[loading/submissionRedirect] --> R3[loading/submissionRedirect]
  end
  R3[loading/submissionRedirect] -->|loaders completed| idle
```

## Fetcher Flows

Fetcher submissions and loads in the Router can each have their own internal states, indicated on `fetcher.state` and `fetcher.type`. As with transitions, these states are a complex and heavily async bit of logic that is foundational to the Router's ability to manage data loading, submission, error handling, redirects, interruptions, and so on. Due to the user-driven nature of interruptions we don't quite believe it can be modeled as a finite state machine, however we have modeled some of the happy path flows below for clarity.

_Note: This does not depict error or interruption flows, nor the ability to re-use fetchers once they've reached `idle/done`._

```mermaid
graph LR
  idle/init -->|"load"| loading/normalLoad
  subgraph "Normal Fetch"
  loading/normalLoad -.->|loader redirected| T1{{transition}}
  end
  loading/normalLoad -->|loader completed| idle/done
  T1{{transition}} -.-> idle/done

  idle/init -->|"submit (get)"| submitting/loaderSubmission
  subgraph "Loader Submission"
  submitting/loaderSubmission -.->|"loader redirected"| T2{{transition}}
  end
  submitting/loaderSubmission -->|loader completed| idle/done
  T2{{transition}} -.-> idle/done

  idle/init -->|"submit (post)"| submitting/actionSubmission
  subgraph "Action Submission"
  submitting/actionSubmission -->|action completed| loading/actionReload
  submitting/actionSubmission -->|action redirected| loading/submissionRedirect
  loading/submissionRedirect -.-> T3{{transition}}
  loading/actionReload -.-> |loaders redirected| T3{{transition}}
  end
  T3{{transition}} -.-> idle/done
  loading/actionReload --> |loaders completed| idle/done

  idle/done -->|"revalidate"| loading/revalidate
  subgraph "Fetcher Revalidation"
  loading/revalidate -.->|loader redirected| T4{{transition}}
  end
  loading/revalidate -->|loader completed| idle/done
  T4{{transition}} -.-> idle/done

  classDef transition fill:lightgreen;
  class T1,T2,T3,T4 transition;
```
