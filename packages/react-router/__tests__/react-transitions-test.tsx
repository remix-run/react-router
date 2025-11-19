import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import * as React from "react";
import {
  Outlet,
  RouterProvider,
  createMemoryRouter,
  useLoaderData,
  useNavigation,
  useRevalidator,
} from "react-router";

import {
  Form,
  Link,
  createBrowserRouter,
  useActionData,
  useFetcher,
  useNavigate,
  useSubmit,
} from "../index";
import { createDeferred, tick } from "./router/utils/utils";
import getWindow from "./utils/getWindow";

describe("react transitions", () => {
  describe("<RouterProvider unstable_useTransitions={undefined} />", () => {
    it("normal navigations surface all updates", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button id="increment" onClick={() => setCount((c) => c + 1)}>
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let navigate = useNavigate();
                return (
                  <button id="link" onClick={() => navigate("/page")}>
                    Go to page
                  </button>
                );
              },
            },
            {
              path: "page",
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(<RouterProvider router={router} />);

      await waitFor(() => screen.getByText("Go to page"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#link")!);
      // Without useOptimistic under the hood, our mid-navigation state updates don't surface
      await waitFor(() => screen.getByText("Navigation:loading"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:1"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:loading")).toBeDefined();

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("normal submissions surface all updates", async () => {
      let actionDfd = createDeferred();
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button id="increment" onClick={() => setCount((c) => c + 1)}>
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let submit = useSubmit();
                return (
                  <button
                    id="submit"
                    onClick={() =>
                      submit({}, { method: "post", action: "/page" })
                    }
                  >
                    Submit
                  </button>
                );
              },
            },
            {
              path: "page",
              action: () => actionDfd.promise,
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(<RouterProvider router={router} />);

      await waitFor(() => screen.getByText("Submit"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#submit")!);
      await waitFor(() => screen.getByText("Navigation:submitting"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:1"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:submitting")).toBeDefined();

      actionDfd.resolve("Action");
      await waitFor(() => screen.getByText("Navigation:loading"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:3"));

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:3"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("navigations can be manually wrapped in startTransition (buggy optimistic behavior)", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let navigate = useNavigate();
                return (
                  <button
                    id="link"
                    onClick={() => {
                      // @ts-expect-error - Needs react 19 types
                      React.startTransition(() => navigate("/page"));
                    }}
                  >
                    Go to page
                  </button>
                );
              },
            },
            {
              path: "page",
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(<RouterProvider router={router} />);

      await waitFor(() => screen.getByText("Go to page"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // Without useOptimistic under the hood, our mid-navigation state updates
      // don't surface
      await fireEvent.click(container.querySelector("#link")!);
      await waitFor(() => screen.getByText("Navigation:idle"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("submissions can be manually wrapped in startTransition (buggy optimistic behavior)", async () => {
      let actionDfd = createDeferred();
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let submit = useSubmit();
                return (
                  <button
                    id="submit"
                    onClick={() => {
                      React.startTransition(() =>
                        // @ts-expect-error - Needs react 19 types
                        submit({}, { method: "post", action: "/page" }),
                      );
                    }}
                  >
                    Submit
                  </button>
                );
              },
            },
            {
              path: "page",
              action: () => actionDfd.promise,
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(<RouterProvider router={router} />);

      await waitFor(() => screen.getByText("Submit"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // Without useOptimistic under the hood, our mid-navigation state updates
      // don't surface
      await fireEvent.click(container.querySelector("#submit")!);
      await waitFor(() => screen.getByText("Navigation:idle"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();

      await act(() => {
        actionDfd.resolve("Action");
      });
      await tick();
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:3"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });
  });

  describe("<RouterProvider unstable_useTransitions={false} />", () => {
    it("navigations are not transition-enabled", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let navigate = useNavigate();
                return (
                  <button id="link" onClick={() => navigate("/page")}>
                    Go to page
                  </button>
                );
              },
            },
            {
              path: "page",
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={false} />,
      );

      await waitFor(() => screen.getByText("Go to page"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // Without transitions enabled, all updates surface during navigation
      await fireEvent.click(container.querySelector("#link")!);
      await waitFor(() => screen.getByText("Navigation:loading"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:1"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:loading")).toBeDefined();

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("submissions are not transition-enabled", async () => {
      let actionDfd = createDeferred();
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let submit = useSubmit();
                return (
                  <button
                    id="submit"
                    onClick={() =>
                      submit({}, { method: "post", action: "/page" })
                    }
                  >
                    Submit
                  </button>
                );
              },
            },
            {
              path: "page",
              action: () => actionDfd.promise,
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(<RouterProvider router={router} />);

      await waitFor(() => screen.getByText("Submit"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // Without transitions enabled, all updates surface during navigation
      await fireEvent.click(container.querySelector("#submit")!);
      await waitFor(() => screen.getByText("Navigation:submitting"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:1"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:submitting")).toBeDefined();

      actionDfd.resolve("Action");
      await waitFor(() => screen.getByText("Navigation:loading"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:3"));

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:3"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });
  });

  describe("<RouterProvider unstable_useTransitions={true} />", () => {
    it("Link navigations are transition-enabled", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let navigate = useNavigate();
                return (
                  <Link id="link" to="/page">
                    Go to page
                  </Link>
                );
              },
            },
            {
              path: "page",
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Go to page"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // With transitions enabled, our updates surface via useOptimistic, but
      // other transition-enabled updates do not
      await fireEvent.click(container.querySelector("#link")!);
      await waitFor(() => screen.getByText("Navigation:loading"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      expect(screen.getByText("Navigation:loading")).toBeDefined();

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("useNavigate navigations are not transition-enabled", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let navigate = useNavigate();
                return (
                  <button id="link" onClick={() => navigate("/page")}>
                    Go to page
                  </button>
                );
              },
            },
            {
              path: "page",
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Go to page"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // With transitions enabled, our updates surface via useOptimistic, but
      // other transition-enabled updates do not
      await fireEvent.click(container.querySelector("#link")!);
      await waitFor(() => screen.getByText("Navigation:loading"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:1"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:loading")).toBeDefined();

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("useNavigate navigations can be transition-enabled", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let navigate = useNavigate();
                let [pending, startTransition] = React.useTransition();
                return (
                  <button
                    id="link"
                    // @ts-expect-error Needs react 19 types
                    onClick={() => startTransition(() => navigate("/page"))}
                  >
                    Go to page{pending ? " (pending)" : null}
                  </button>
                );
              },
            },
            {
              path: "page",
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Go to page"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // With transitions enabled, our updates surface via useOptimistic, but
      // other transition-enabled updates do not
      await fireEvent.click(container.querySelector("#link")!);
      await waitFor(() => screen.getByText("Navigation:loading"));
      expect(screen.getByText("Increment:0")).toBeDefined();
      expect(screen.getByText("Go to page (pending)")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      expect(screen.getByText("Navigation:loading")).toBeDefined();

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("Form submissions are transition-enabled", async () => {
      let actionDfd = createDeferred();
      let loaderDfd = createDeferred();
      let router = createBrowserRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                return (
                  <Form method="post" action="/page">
                    <button id="submit" type="submit" name="name" value="value">
                      Submit
                    </button>
                  </Form>
                );
              },
            },
            {
              path: "page",
              action: () => actionDfd.promise,
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Submit"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // Without transitions enabled, all updates surface during navigation
      await fireEvent.click(container.querySelector("#submit")!);
      await waitFor(() => screen.getByText("Navigation:submitting"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      expect(screen.getByText("Navigation:submitting")).toBeDefined();

      actionDfd.resolve("Action");
      await waitFor(() => screen.getByText("Navigation:loading"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:3"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("useSubmit submissions are not transition-enabled", async () => {
      let actionDfd = createDeferred();
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let submit = useSubmit();
                return (
                  <button
                    id="submit"
                    onClick={() =>
                      submit({}, { method: "post", action: "/page" })
                    }
                  >
                    Submit
                  </button>
                );
              },
            },
            {
              path: "page",
              action: () => actionDfd.promise,
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Submit"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // Without transitions enabled, all updates surface during navigation
      await fireEvent.click(container.querySelector("#submit")!);
      await waitFor(() => screen.getByText("Navigation:submitting"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:1"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Navigation:submitting")).toBeDefined();

      actionDfd.resolve("Action");
      await waitFor(() => screen.getByText("Navigation:loading"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:3"));

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:3"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("useSubmit submissions can be transition-enabled", async () => {
      let actionDfd = createDeferred();
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                let submit = useSubmit();
                let [pending, startTransition] = React.useTransition();
                return (
                  <button
                    id="submit"
                    onClick={() =>
                      startTransition(() =>
                        // @ts-expect-error Needs react 19 types
                        submit({}, { method: "post", action: "/page" }),
                      )
                    }
                  >
                    Submit{pending ? " (pending)" : null}
                  </button>
                );
              },
            },
            {
              path: "page",
              action: () => actionDfd.promise,
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
          ],
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Submit"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // Without transitions enabled, all updates surface during navigation
      await fireEvent.click(container.querySelector("#submit")!);
      await waitFor(() => screen.getByText("Navigation:submitting"));
      expect(screen.getByText("Increment:0")).toBeDefined();
      expect(screen.getByText("Submit (pending)")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      expect(screen.getByText("Navigation:submitting")).toBeDefined();

      actionDfd.resolve("Action");
      await waitFor(() => screen.getByText("Navigation:loading"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      await waitFor(() => screen.getByText("Increment:3"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("actionData surfaces during the transition", async () => {
      let actionDfd = createDeferred();
      let loaderDfd = createDeferred();
      let router = createBrowserRouter(
        [
          {
            id: "index",
            path: "/",
            action: () => actionDfd.promise,
            loader: () => loaderDfd.promise,
            Component() {
              let loaderData = useLoaderData();
              let actionData = useActionData();
              let navigation = useNavigation();
              return (
                <>
                  <p>{`Loader:${loaderData}`}</p>
                  <p>{`Action:${actionData}`}</p>
                  <p>{`Navigation:${navigation.state}`}</p>
                  <Form method="post">
                    <button id="submit" type="submit" name="name" value="value">
                      Submit
                    </button>
                  </Form>
                </>
              );
            },
          },
        ],
        {
          hydrationData: {
            loaderData: {
              index: "initial",
            },
          },
          window: getWindow("/"),
        },
      );

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Submit"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Loader:initial")).toBeDefined();
      expect(screen.getByText("Action:undefined")).toBeDefined();

      await fireEvent.click(container.querySelector("#submit")!);
      await waitFor(() => screen.getByText("Navigation:submitting"));

      actionDfd.resolve("action-data");
      await waitFor(() => screen.getByText("Navigation:loading"));
      expect(screen.getByText("Loader:initial")).toBeDefined();
      expect(screen.getByText("Action:action-data")).toBeDefined();

      loaderDfd.resolve("revalidated");
      await waitFor(() => screen.getByText("Navigation:idle"));
      expect(screen.getByText("Loader:revalidated")).toBeDefined();
      expect(screen.getByText("Action:action-data")).toBeDefined();
    });

    it("useFetcher is not transition-enabled", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let fetcher = useFetcher();
            let [count, setCount] = React.useState(0);
            return (
              <>
                <p>{`Fetcher:${fetcher.state}:${fetcher.data}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <button id="fetch" onClick={() => fetcher.load("/fetch")}>
                  Fetch
                </button>
                <Outlet />
              </>
            );
          },
        },
        {
          path: "fetch",
          loader: () => loaderDfd.promise,
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Fetch"));
      expect(screen.getByText("Fetcher:idle:undefined")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // With transitions enabled, our updates surface via useOptimistic, but
      // other transition-enabled updates do not
      await fireEvent.click(container.querySelector("#fetch")!);
      await waitFor(() => screen.getByText("Fetcher:loading:undefined"));
      expect(screen.getByText("Increment:0")).toBeDefined();
      expect(screen.getByText("Fetch")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:1"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Fetcher:loading:undefined")).toBeDefined();

      loaderDfd.resolve("data");
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Fetcher:idle:data")).toBeDefined();
    });

    it("useFetcher can be transition-enabled", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let fetcher = useFetcher();
            let [count, setCount] = React.useState(0);
            let [pending, startTransition] = React.useTransition();
            return (
              <>
                <p>{`Fetcher:${fetcher.state}:${fetcher.data}`}</p>
                <button
                  id="increment"
                  onClick={() =>
                    React.startTransition(() => setCount((c) => c + 1))
                  }
                >
                  {`Increment:${count}`}
                </button>
                <button
                  id="fetch"
                  // @ts-expect-error Needs react 19 types
                  onClick={() => startTransition(() => fetcher.load("/fetch"))}
                >
                  Fetch{pending ? " (pending)" : null}
                </button>
                <Outlet />
              </>
            );
          },
        },
        {
          path: "fetch",
          loader: () => loaderDfd.promise,
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Fetch"));
      expect(screen.getByText("Fetcher:idle:undefined")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();

      // With transitions enabled, our updates surface via useOptimistic, but
      // other transition-enabled updates do not
      await fireEvent.click(container.querySelector("#fetch")!);
      await waitFor(() => screen.getByText("Fetcher:loading:undefined"));
      expect(screen.getByText("Increment:0")).toBeDefined();
      expect(screen.getByText("Fetch (pending)")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      expect(screen.getByText("Fetcher:loading:undefined")).toBeDefined();

      loaderDfd.resolve("data");
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Fetcher:idle:data")).toBeDefined();
    });

    it("fetcher updates surface mid-navigation", async () => {
      let loaderDfd = createDeferred();
      let fetcherDfd = createDeferred();
      let router = createMemoryRouter([
        {
          path: "/",
          Component() {
            let navigation = useNavigation();
            let fetcher = useFetcher();
            return (
              <>
                <p>{`Navigation:${navigation.state}`}</p>
                <button id="fetch" onClick={() => fetcher.load("/fetch")}>
                  {`Fetcher ${fetcher.state}:${fetcher.data}`}
                </button>
                <Outlet />
              </>
            );
          },
          children: [
            {
              index: true,
              Component() {
                return (
                  <Link id="link" to="/page">
                    Go to page
                  </Link>
                );
              },
            },
            {
              path: "page",
              loader: () => loaderDfd.promise,
              Component() {
                return <h1>{useLoaderData()}</h1>;
              },
            },
            {
              path: "fetch",
              loader: () => fetcherDfd.promise,
            },
          ],
        },
      ]);

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Go to page"));
      expect(screen.getByText("Navigation:idle")).toBeDefined();
      expect(screen.getByText("Fetcher idle:undefined")).toBeDefined();

      // With transitions enabled, our updates surface via useOptimistic, but
      // other transition-enabled updates do not
      await fireEvent.click(container.querySelector("#link")!);
      await waitFor(() => screen.getByText("Navigation:loading"));
      expect(screen.getByText("Fetcher idle:undefined")).toBeDefined();

      await fireEvent.click(container.querySelector("#fetch")!);
      await waitFor(() => screen.getByText("Fetcher loading:undefined"));
      expect(screen.getByText("Navigation:loading")).toBeDefined();

      fetcherDfd.resolve("data");
      await waitFor(() => screen.getByText("Fetcher idle:data"));
      expect(screen.getByText("Navigation:loading")).toBeDefined();

      loaderDfd.resolve("Page");
      await waitFor(() => screen.getByText("Page"));
      expect(screen.getByText("Fetcher idle:data")).toBeDefined();
      expect(screen.getByText("Navigation:idle")).toBeDefined();
    });

    it("useRevalidator is not transition-enabled", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter(
        [
          {
            id: "index",
            path: "/",
            loader: () => loaderDfd.promise,
            Component() {
              let data = useLoaderData();
              let revalidator = useRevalidator();
              let [count, setCount] = React.useState(0);
              return (
                <>
                  <p>{`Loader:${data}`}</p>
                  <p>{`Revalidator:${revalidator.state}`}</p>
                  <button
                    id="increment"
                    onClick={() =>
                      React.startTransition(() => setCount((c) => c + 1))
                    }
                  >
                    {`Increment:${count}`}
                  </button>
                  <button
                    id="revalidate"
                    onClick={() => revalidator.revalidate()}
                  >
                    Revalidate
                  </button>
                </>
              );
            },
          },
        ],
        {
          hydrationData: {
            loaderData: {
              index: "initial",
            },
          },
        },
      );

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Revalidate"));
      expect(screen.getByText("Revalidator:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();
      expect(screen.getByText("Loader:initial")).toBeDefined();

      // With transitions enabled, our updates surface via useOptimistic, but
      // other transition-enabled updates do not
      await fireEvent.click(container.querySelector("#revalidate")!);
      await waitFor(() => screen.getByText("Revalidator:loading"));
      expect(screen.getByText("Increment:0")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:1"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Revalidator:loading")).toBeDefined();

      loaderDfd.resolve("revalidated");
      await waitFor(() => screen.getByText("Revalidator:idle"));
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Loader:revalidated")).toBeDefined();
    });

    it("useRevalidator can be transition-enabled", async () => {
      let loaderDfd = createDeferred();
      let router = createMemoryRouter(
        [
          {
            id: "index",
            path: "/",
            loader: () => loaderDfd.promise,
            Component() {
              let data = useLoaderData();
              let revalidator = useRevalidator();
              let [count, setCount] = React.useState(0);
              let [pending, startTransition] = React.useTransition();
              return (
                <>
                  <p>{`Loader:${data}`}</p>
                  <p>{`Revalidator:${revalidator.state}`}</p>
                  <button
                    id="increment"
                    onClick={() =>
                      React.startTransition(() => setCount((c) => c + 1))
                    }
                  >
                    {`Increment:${count}`}
                  </button>
                  <button
                    id="revalidate"
                    onClick={() =>
                      // @ts-expect-error Needs react 19 types
                      startTransition(() => revalidator.revalidate())
                    }
                  >
                    {`Revalidate${pending ? " (pending)" : ""}`}
                  </button>
                </>
              );
            },
          },
        ],
        {
          hydrationData: {
            loaderData: {
              index: "initial",
            },
          },
        },
      );

      let { container } = render(
        <RouterProvider router={router} unstable_useTransitions={true} />,
      );

      await waitFor(() => screen.getByText("Revalidate"));
      expect(screen.getByText("Revalidator:idle")).toBeDefined();
      expect(screen.getByText("Increment:0")).toBeDefined();
      expect(screen.getByText("Loader:initial")).toBeDefined();

      // With transitions enabled, our updates surface via useOptimistic, but
      // other transition-enabled updates do not
      await fireEvent.click(container.querySelector("#revalidate")!);
      await waitFor(() => screen.getByText("Revalidator:loading"));
      expect(screen.getByText("Increment:0")).toBeDefined();
      expect(screen.getByText("Revalidate (pending)")).toBeDefined();

      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      await fireEvent.click(container.querySelector("#increment")!);
      await waitFor(() => screen.getByText("Increment:0"));
      expect(screen.getByText("Revalidator:loading")).toBeDefined();

      loaderDfd.resolve("revalidated");
      await waitFor(() => screen.getByText("Revalidator:idle"));
      await waitFor(() => screen.getByText("Increment:2"));
      expect(screen.getByText("Loader:revalidated")).toBeDefined();
    });
  });
});
