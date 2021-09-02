# Testing with Jest and ReactDOM `test-utils`

Perhaps the simplest way to write tests in React with Jest is to use ReactDOM's provided `test-utils` module.

- [Testing with Jest and ReactDOM `test-utils`](#testing-with-jest-and-reactdom-test-utils)
  - [Getting Setup](#getting-setup)
  - [Rendering](#rendering)
  - [Router Context](#router-context)
  - [Performing State Updates](#performing-state-updates)
  - [Testing from specific routes](#testing-from-specific-routes)
  - [Navigating in tests](#navigating-in-tests)

<a name="setup"></a>

## Getting Setup

Let's start by writing a test for a `Sidebar` component that renders several `Link` components from `react-router-dom`.

```tsx
// Sidebar.js
import * as React from "react";
export function Sidebar() {
  let [expanded, setExpanded] = React.useState(false);
  function toggleExpand() {
    setExpanded(expanded => !expanded);
  }
  return (
    <div>
      <button onClick={toggleExpand}>Expand the menu</button>
      <ul hidden={expanded ? undefined : true}>
        {users.map(user => (
          <li key={user.name}>
            <Link to={user.path}>{user.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Sidebar.test.js
describe("<Sidebar />", () => {
  it.todo("expands when the button is clicked");
  it.todo("closes when the button is clicked twice");
});
```

So far so good! Let's start by tackling the first test:

```tsx
describe("<Sidebar />", () => {
  it("expands when the button is clicked", () => {
    // 1. Render the sidebar
    // 2. Click the toggle button
    // 3. Assert that the menu is expanded
  });
  it.todo("closes when the button is clicked twice");
});
```

<a name="rendering"></a>

## Rendering

The first thing we need to do in our test is render the component, but rendering in React may perform side effects in a way that makes predictable testing a bit tricky. Thankfully `react-dom/test-utils` provides the [`act` function](https://reactjs.org/docs/test-utils.html#act) that prepares a component for assertions when rendering or triggering updates on our test subject.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Sidebar } from "./Sidebar";

describe("<Sidebar />", () => {
  // We'll need a DOM node in our test environment to mount our component. We
  // can set up a fresh node before each test and clean it up after we're done,
  // ensuring that we know exactly what our resulting DOM should look like in
  // each test.
  let node;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null;
  });

  it("expands when the button is clicked", () => {
    // 1. Render the sidebar
    act(() => {
      ReactDOM.render(<Sidebar />, node);
    });
    // 2. Click the toggle button
    // 3. Assert that the menu is expanded
  });
  it.todo("closes when the button is clicked twice");
});
```

<a name="router-context"></a>

## Router Context

At this point if you start making assertions and run your test, you will probably get an error because `Sidebar` renders a `Link` from `react-router-dom` which expects some context from a router.

While you may be tempted to stub out the router context yourself, we recommend wrapping your unit test in one of the Router components:

- the base `<Router>` with a `history` prop
- `<StaticRouter>`
- `<MemoryRouter>`
- `<BrowserRouter>` if `window.history` is available as a global in your test enviroment

Using `<MemoryRouter>` or a custom `history` is recommended in order to be able to reset the router between tests.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

describe("<Sidebar />", () => {
  let node;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null;
  });

  it("expands when the button is clicked", () => {
    // 1. Render the sidebar in a router
    act(() => {
      ReactDOM.render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>,
        node
      );
    });
    // 2. Click the toggle button
    // 3. Assert that the menu is expanded
  });
  it.todo("closes when the button is clicked twice");
});
```

<a name="state-updates"></a>

## Performing State Updates

Now that we've provided the component with router context, we can perform any actions we need and start making assertions.

```tsx
describe("<Sidebar />", () => {
  // ... setup/cleanup

  function click(element) {
    element.dispatchEvent(
      new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true
      })
    );
  }

  it("expands when the button is clicked", () => {
    // 1. Render the sidebar in a router
    act(() => {
      ReactDOM.render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>,
        node
      );
    });
    // 2. Click the toggle button
    let button = node.querySelector("button");
    act(() => click(button));

    // 3. Assert that the menu is expanded
    let menu = node.querySelector("ul");
    expect(menu.hasAttribute("hidden")).toBe(false);
  });
  it.todo("closes when the button is clicked twice");
});
```

It's important that any actions performing state updates on your component are also wrapped in the `act` function.

<a name="testing-from-specific-routes"></a>

## Testing from specific routes

TODO

<a name="navigating-in-tests"></a>

## Navigating in tests

TODO
