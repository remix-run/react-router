---
title: State Management
---

# State Management

State management in React typically involves maintaining a synchronized cache of server data on the client side. However, when using React Router as your framework, most of the traditional caching solutions become redundant because of how it inherently handles data synchronization.

## Understanding State Management in React

In a typical React context, when we refer to "state management", we're primarily discussing how we synchronize server state with the client. A more apt term could be "cache management" because the server is the source of truth and the client state is mostly functioning as a cache.

Popular caching solutions in React include:

- **Redux:** A predictable state container for JavaScript apps.
- **React Query:** Hooks for fetching, caching, and updating asynchronous data in React.
- **Apollo:** A comprehensive state management library for JavaScript that integrates with GraphQL.

In certain scenarios, using these libraries may be warranted. However, with React Router's unique server-focused approach, their utility becomes less prevalent. In fact, most React Router applications forgo them entirely.

## How React Router Simplifies State

React Router seamlessly bridges the gap between the backend and frontend via mechanisms like loaders, actions, and forms with automatic synchronization through revalidation. This offers developers the ability to directly use server state within components without managing a cache, the network communication, or data revalidation, making most client-side caching redundant.

Here's why using typical React state patterns might be an anti-pattern in React Router:

1. **Network-related State:** If your React state is managing anything related to the network—such as data from loaders, pending form submissions, or navigational states—it's likely that you're managing state that React Router already manages:

   - **[`useNavigation`][use_navigation]**: This hook gives you access to `navigation.state`, `navigation.formData`, `navigation.location`, etc.
   - **[`useFetcher`][use_fetcher]**: This facilitates interaction with `fetcher.state`, `fetcher.formData`, `fetcher.data` etc.
   - **[`loaderData`][loader_data]**: Access the data for a route.
   - **[`actionData`][action_data]**: Access the data from the latest action.

2. **Storing Data in React Router:** A lot of data that developers might be tempted to store in React state has a more natural home in React Router, such as:

   - **URL Search Params:** Parameters within the URL that hold state.
   - **[Cookies][cookies]:** Small pieces of data stored on the user's device.
   - **[Server Sessions][sessions]:** Server-managed user sessions.
   - **Server Caches:** Cached data on the server side for quicker retrieval.

3. **Performance Considerations:** At times, client state is leveraged to avoid redundant data fetching. With React Router, you can use the [`Cache-Control`][cache_control_header] headers within `loader`s, allowing you to tap into the browser's native cache. However, this approach has its limitations and should be used judiciously. It's usually more beneficial to optimize backend queries or implement a server cache. This is because such changes benefit all users and do away with the need for individual browser caches.

As a developer transitioning to React Router, it's essential to recognize and embrace its inherent efficiencies rather than applying traditional React patterns. React Router offers a streamlined solution to state management leading to less code, fresh data, and no state synchronization bugs.

## Examples

### Network Related State

For examples on using React Router's internal state to manage network related state, refer to [Pending UI][pending_ui].

### URL Search Params

Consider a UI that lets the user customize between list view or detail view. Your instinct might be to reach for React state:

```tsx bad lines=[2,6,9]
export function List() {
  const [view, setView] = useState("list");
  return (
    <div>
      <div>
        <button onClick={() => setView("list")}>
          View as List
        </button>
        <button onClick={() => setView("details")}>
          View with Details
        </button>
      </div>
      {view === "list" ? <ListView /> : <DetailView />}
    </div>
  );
}
```

Now consider you want the URL to update when the user changes the view. Note the state synchronization:

```tsx bad lines=[7,16,24]
import { useNavigate, useSearchParams } from "react-router";

export function List() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState(
    searchParams.get("view") || "list"
  );

  return (
    <div>
      <div>
        <button
          onClick={() => {
            setView("list");
            navigate(`?view=list`);
          }}
        >
          View as List
        </button>
        <button
          onClick={() => {
            setView("details");
            navigate(`?view=details`);
          }}
        >
          View with Details
        </button>
      </div>
      {view === "list" ? <ListView /> : <DetailView />}
    </div>
  );
}
```

Instead of synchronizing state, you can simply read and set the state in the URL directly with boring old HTML forms:

```tsx good lines=[5,9-16]
import { Form, useSearchParams } from "react-router";

export function List() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "list";

  return (
    <div>
      <Form>
        <button name="view" value="list">
          View as List
        </button>
        <button name="view" value="details">
          View with Details
        </button>
      </Form>
      {view === "list" ? <ListView /> : <DetailView />}
    </div>
  );
}
```

### Persistent UI State

Consider a UI that toggles a sidebar's visibility. We have three ways to handle the state:

1. React state
2. Browser local storage
3. Cookies

In this discussion, we'll break down the trade-offs associated with each method.

#### React State

React state provides a simple solution for temporary state storage.

**Pros**:

- **Simple**: Easy to implement and understand.
- **Encapsulated**: State is scoped to the component.

**Cons**:

- **Transient**: Doesn't survive page refreshes, returning to the page later, or unmounting and remounting the component.

**Implementation**:

```tsx
function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "Close" : "Open"}
      </button>
      <aside hidden={!isOpen}>
        <Outlet />
      </aside>
    </div>
  );
}
```

#### Local Storage

To persist state beyond the component lifecycle, browser local storage is a step-up. See our doc on [Client Data][client_data] for more advanced examples.

**Pros**:

- **Persistent**: Maintains state across page refreshes and component mounts/unmounts.
- **Encapsulated**: State is scoped to the component.

**Cons**:

- **Requires Synchronization**: React components must sync up with local storage to initialize and save the current state.
- **Server Rendering Limitation**: The [`window`][window_global] and [`localStorage`][local_storage_global] objects are not accessible during server-side rendering, so state must be initialized in the browser with an effect.
- **UI Flickering**: On initial page loads, the state in local storage may not match what was rendered by the server and the UI will flicker when JavaScript loads.

**Implementation**:

```tsx
function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // synchronize initially
  useLayoutEffect(() => {
    const isOpen = window.localStorage.getItem("sidebar");
    setIsOpen(isOpen);
  }, []);

  // synchronize on change
  useEffect(() => {
    window.localStorage.setItem("sidebar", isOpen);
  }, [isOpen]);

  return (
    <div>
      <button onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "Close" : "Open"}
      </button>
      <aside hidden={!isOpen}>
        <Outlet />
      </aside>
    </div>
  );
}
```

In this approach, state must be initialized within an effect. This is crucial to avoid complications during server-side rendering. Directly initializing the React state from `localStorage` will cause errors since `window.localStorage` is unavailable during server rendering.

```tsx bad lines=[4]
function Sidebar() {
  const [isOpen, setIsOpen] = useState(
    // error: window is not defined
    window.localStorage.getItem("sidebar")
  );

  // ...
}
```

By initializing the state within an effect, there's potential for a mismatch between the server-rendered state and the state stored in local storage. This discrepancy will lead to brief UI flickering shortly after the page renders and should be avoided.

#### Cookies

Cookies offer a comprehensive solution for this use case. However, this method introduces added preliminary setup before making the state accessible within the component.

**Pros**:

- **Server Rendering**: State is available on the server for rendering and even for server actions.
- **Single Source of Truth**: Eliminates state synchronization hassles.
- **Persistence**: Maintains state across page loads and component mounts/unmounts. State can even persist across devices if you switch to a database-backed session.
- **Progressive Enhancement**: Functions even before JavaScript loads.

**Cons**:

- **Boilerplate**: Requires more code because of the network.
- **Exposed**: The state is not encapsulated to a single component, other parts of the app must be aware of the cookie.

**Implementation**:

First we'll need to create a cookie object:

```tsx
import { createCookie } from "react-router";
export const prefs = createCookie("prefs");
```

Next we set up the server action and loader to read and write the cookie:

```tsx filename=app/routes/sidebar.tsx
import { data, Outlet } from "react-router";
import type { Route } from "./+types/sidebar";

import { prefs } from "./prefs-cookie";

// read the state from the cookie
export async function loader({
  request,
}: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await prefs.parse(cookieHeader)) || {};
  return data({ sidebarIsOpen: cookie.sidebarIsOpen });
}

// write the state to the cookie
export async function action({
  request,
}: Route.ActionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await prefs.parse(cookieHeader)) || {};
  const formData = await request.formData();

  const isOpen = formData.get("sidebar") === "open";
  cookie.sidebarIsOpen = isOpen;

  return data(isOpen, {
    headers: {
      "Set-Cookie": await prefs.serialize(cookie),
    },
  });
}
```

After the server code is set up, we can use the cookie state in our UI:

```tsx
function Sidebar({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  let { sidebarIsOpen } = loaderData;

  // use optimistic UI to immediately change the UI state
  if (fetcher.formData?.has("sidebar")) {
    sidebarIsOpen =
      fetcher.formData.get("sidebar") === "open";
  }

  return (
    <div>
      <fetcher.Form method="post">
        <button
          name="sidebar"
          value={sidebarIsOpen ? "closed" : "open"}
        >
          {sidebarIsOpen ? "Close" : "Open"}
        </button>
      </fetcher.Form>
      <aside hidden={!sidebarIsOpen}>
        <Outlet />
      </aside>
    </div>
  );
}
```

While this is certainly more code that touches more of the application to account for the network requests and responses, the UX is greatly improved. Additionally, state comes from a single source of truth without any state synchronization required.

In summary, each of the discussed methods offers a unique set of benefits and challenges:

- **React state**: Offers simple but transient state management.
- **Local Storage**: Provides persistence but with synchronization requirements and UI flickering.
- **Cookies**: Delivers robust, persistent state management at the cost of added boilerplate.

None of these are wrong, but if you want to persist the state across visits, cookies offer the best user experience.

### Form Validation and Action Data

Client-side validation can augment the user experience, but similar enhancements can be achieved by leaning more towards server-side processing and letting it handle the complexities.

The following example illustrates the inherent complexities of managing network state, coordinating state from the server, and implementing validation redundantly on both the client and server sides. It's just for illustration, so forgive any obvious bugs or problems you find.

```tsx bad lines=[2,11,27,38,63]
export function Signup() {
  // A multitude of React State declarations
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userName, setUserName] = useState("");
  const [userNameError, setUserNameError] = useState(null);

  const [password, setPassword] = useState(null);
  const [passwordError, setPasswordError] = useState("");

  // Replicating server-side logic in the client
  function validateForm() {
    setUserNameError(null);
    setPasswordError(null);
    const errors = validateSignupForm(userName, password);
    if (errors) {
      if (errors.userName) {
        setUserNameError(errors.userName);
      }
      if (errors.password) {
        setPasswordError(errors.password);
      }
    }
    return Boolean(errors);
  }

  // Manual network interaction handling
  async function handleSubmit() {
    if (validateForm()) {
      setSubmitting(true);
      const res = await postJSON("/api/signup", {
        userName,
        password,
      });
      const json = await res.json();
      setIsSubmitting(false);

      // Server state synchronization to the client
      if (json.errors) {
        if (json.errors.userName) {
          setUserNameError(json.errors.userName);
        }
        if (json.errors.password) {
          setPasswordError(json.errors.password);
        }
      }
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <p>
        <input
          type="text"
          name="username"
          value={userName}
          onChange={() => {
            // Synchronizing form state for the fetch
            setUserName(event.target.value);
          }}
        />
        {userNameError ? <i>{userNameError}</i> : null}
      </p>

      <p>
        <input
          type="password"
          name="password"
          onChange={(event) => {
            // Synchronizing form state for the fetch
            setPassword(event.target.value);
          }}
        />
        {passwordError ? <i>{passwordError}</i> : null}
      </p>

      <button disabled={isSubmitting} type="submit">
        Sign Up
      </button>

      {isSubmitting ? <BusyIndicator /> : null}
    </form>
  );
}
```

The backend endpoint, `/api/signup`, also performs validation and sends error feedback. Note that some essential validation, like detecting duplicate usernames, can only be done server-side using information the client doesn't have access to.

```tsx bad
export async function signupHandler(request: Request) {
  const errors = await validateSignupRequest(request);
  if (errors) {
    return { ok: false, errors: errors };
  }
  await signupUser(request);
  return { ok: true, errors: null };
}
```

Now, let's contrast this with a React Router-based implementation. The action remains consistent, but the component is vastly simplified due to the direct utilization of server state via `actionData`, and leveraging the network state that React Router inherently manages.

```tsx filename=app/routes/signup.tsx good lines=[20-22]
import { useNavigation } from "react-router";
import type { Route } from "./+types/signup";

export async function action({
  request,
}: ActionFunctionArgs) {
  const errors = await validateSignupRequest(request);
  if (errors) {
    return { ok: false, errors: errors };
  }
  await signupUser(request);
  return { ok: true, errors: null };
}

export function Signup({
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();

  const userNameError = actionData?.errors?.userName;
  const passwordError = actionData?.errors?.password;
  const isSubmitting = navigation.formAction === "/signup";

  return (
    <Form method="post">
      <p>
        <input type="text" name="username" />
        {userNameError ? <i>{userNameError}</i> : null}
      </p>

      <p>
        <input type="password" name="password" />
        {passwordError ? <i>{passwordError}</i> : null}
      </p>

      <button disabled={isSubmitting} type="submit">
        Sign Up
      </button>

      {isSubmitting ? <BusyIndicator /> : null}
    </Form>
  );
}
```

The extensive state management from our previous example is distilled into just three code lines. We eliminate the necessity for React state, change event listeners, submit handlers, and state management libraries for such network interactions.

Direct access to the server state is made possible through `actionData`, and network state through `useNavigation` (or `useFetcher`).

As bonus party trick, the form is functional even before JavaScript loads (see [Progressive Enhancement][progressive_enhancement]). Instead of React Router managing the network operations, the default browser behaviors step in.

If you ever find yourself entangled in managing and synchronizing state for network operations, React Router likely offers a more elegant solution.

[use_navigation]: https://api.reactrouter.com/v7/functions/react_router.useNavigation
[use_fetcher]: https://api.reactrouter.com/v7/functions/react_router.useFetcher
[loader_data]: ../start/framework/data-loading
[action_data]: ../start/framework/actions
[cookies]: ./sessions-and-cookies#cookies
[sessions]: ./sessions-and-cookies#sessions
[cache_control_header]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
[pending_ui]: ../start/framework/pending-ui
[client_data]: ../how-to/client-data
[window_global]: https://developer.mozilla.org/en-US/docs/Web/API/Window/window
[local_storage_global]: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
[progressive_enhancement]: ./progressive-enhancement
