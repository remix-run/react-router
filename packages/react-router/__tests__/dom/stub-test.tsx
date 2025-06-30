import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import {
  Form,
  Outlet,
  useActionData,
  useFetcher,
  useLoaderData,
  useMatches,
  createRoutesStub,
  type LoaderFunctionArgs,
  useRouteError,
} from "../../index";
import { unstable_createContext } from "../../lib/router/utils";

test("renders a route", () => {
  let RoutesStub = createRoutesStub([
    {
      path: "/",
      Component: () => <div>HOME</div>,
    },
  ]);

  render(<RoutesStub />);

  expect(screen.getByText("HOME")).toBeInTheDocument();
});

test("renders a nested route", () => {
  let RoutesStub = createRoutesStub([
    {
      Component() {
        return (
          <div>
            <h1>ROOT</h1>
            <Outlet />
          </div>
        );
      },
      children: [
        {
          path: "/",
          Component: () => <div>INDEX</div>,
        },
      ],
    },
  ]);

  render(<RoutesStub />);

  expect(screen.getByText("ROOT")).toBeInTheDocument();
  expect(screen.getByText("INDEX")).toBeInTheDocument();
});

// eslint-disable-next-line jest/expect-expect
test("loaders work", async () => {
  let RoutesStub = createRoutesStub([
    {
      path: "/",
      HydrateFallback: () => null,
      Component() {
        let data = useLoaderData();
        return <pre data-testid="data">Message: {data.message}</pre>;
      },
      loader() {
        return Response.json({ message: "hello" });
      },
    },
  ]);

  render(<RoutesStub />);

  await waitFor(() => screen.findByText("Message: hello"));
});

// eslint-disable-next-line jest/expect-expect
test("loaders work with props", async () => {
  let RoutesStub = createRoutesStub([
    {
      path: "/",
      HydrateFallback: () => null,
      Component({ loaderData }) {
        let data = loaderData as { message: string };
        return <pre data-testid="data">Message: {data.message}</pre>;
      },
      loader() {
        return { message: "hello" };
      },
    },
  ]);

  render(<RoutesStub />);

  await waitFor(() => screen.findByText("Message: hello"));
});

// eslint-disable-next-line jest/expect-expect
test("actions work", async () => {
  let RoutesStub = createRoutesStub([
    {
      path: "/",
      Component() {
        let data = useActionData() as { message: string } | undefined;
        return (
          <Form method="post">
            <button type="submit">Submit</button>
            {data ? <pre>Message: {data.message}</pre> : null}
          </Form>
        );
      },
      action() {
        return Response.json({ message: "hello" });
      },
    },
  ]);

  render(<RoutesStub />);

  user.click(screen.getByText("Submit"));
  await waitFor(() => screen.findByText("Message: hello"));
});

// eslint-disable-next-line jest/expect-expect
test("actions work with props", async () => {
  let RoutesStub = createRoutesStub([
    {
      path: "/",
      Component({ actionData }) {
        let data = actionData as { message: string } | undefined;
        return (
          <Form method="post">
            <button type="submit">Submit</button>
            {data ? <pre>Message: {data.message}</pre> : null}
          </Form>
        );
      },
      action() {
        return Response.json({ message: "hello" });
      },
    },
  ]);

  render(<RoutesStub />);

  user.click(screen.getByText("Submit"));
  await waitFor(() => screen.findByText("Message: hello"));
});

// eslint-disable-next-line jest/expect-expect
test("errors work", async () => {
  let spy = jest.spyOn(console, "error").mockImplementation(() => {});
  let RoutesStub = createRoutesStub([
    {
      path: "/",
      Component() {
        throw new Error("Broken!");
      },
      ErrorBoundary() {
        let error = useRouteError() as Error;
        return <p>Error: {error.message}</p>;
      },
    },
  ]);

  render(<RoutesStub />);

  await waitFor(() => screen.findByText("Error: Broken!"));
  spy.mockRestore();
});

// eslint-disable-next-line jest/expect-expect
test("errors work with prop", async () => {
  let spy = jest.spyOn(console, "error").mockImplementation(() => {});
  let RoutesStub = createRoutesStub([
    {
      path: "/",
      Component() {
        throw new Error("Broken!");
      },
      ErrorBoundary({ error }) {
        return <p>Error: {(error as Error).message}</p>;
      },
    },
  ]);

  render(<RoutesStub />);

  await waitFor(() => screen.findByText("Error: Broken!"));
  spy.mockRestore();
});

// eslint-disable-next-line jest/expect-expect
test("fetchers work", async () => {
  let count = 0;
  let RoutesStub = createRoutesStub([
    {
      path: "/",
      Component() {
        let fetcher = useFetcher<{ count: number }>();
        return (
          <button onClick={() => fetcher.load("/api")}>
            {fetcher.state + " " + (fetcher.data?.count || 0)}
          </button>
        );
      },
    },
    {
      path: "/api",
      loader() {
        return Response.json({ count: ++count });
      },
    },
  ]);

  render(<RoutesStub />);

  user.click(screen.getByText("idle 0"));
  await waitFor(() => screen.findByText("idle 1"));

  user.click(screen.getByText("idle 1"));
  await waitFor(() => screen.findByText("idle 2"));
});

// eslint-disable-next-line jest/expect-expect
test("can pass a predefined loader", () => {
  async function loader(_args: LoaderFunctionArgs) {
    return Response.json({ hi: "there" });
  }

  createRoutesStub([
    {
      path: "/example",
      loader,
    },
  ]);
});

test("can pass context values", async () => {
  let helloContext = unstable_createContext();
  let RoutesStub = createRoutesStub(
    [
      {
        path: "/",
        HydrateFallback: () => null,
        Component() {
          let data = useLoaderData() as string;
          return (
            <div>
              <pre data-testid="root">Context: {data}</pre>
              <Outlet />
            </div>
          );
        },
        loader({ context }) {
          return context.get(helloContext);
        },
        children: [
          {
            path: "hello",
            Component() {
              let data = useLoaderData() as string;
              return <pre data-testid="hello">Context: {data}</pre>;
            },
            loader({ context }) {
              return context.get(helloContext);
            },
          },
        ],
      },
    ],
    () => new Map([[helloContext, "hello"]])
  );

  render(<RoutesStub initialEntries={["/hello"]} />);

  expect(await screen.findByTestId("root")).toHaveTextContent(/Context: hello/);
  expect(await screen.findByTestId("hello")).toHaveTextContent(
    /Context: hello/
  );
});

test("all routes have ids", () => {
  let RoutesStub = createRoutesStub([
    {
      Component() {
        return (
          <div>
            <h1>ROOT</h1>
            <Outlet />
          </div>
        );
      },
      children: [
        {
          path: "/",
          Component() {
            let matches = useMatches();

            return (
              <div>
                <h1>HOME</h1>
                <pre data-testid="matches">
                  {JSON.stringify(matches, null, 2)}
                </pre>
              </div>
            );
          },
        },
      ],
    },
  ]);

  render(<RoutesStub />);

  let matchesTextContent = screen.getByTestId("matches").textContent;

  expect(matchesTextContent).toBeDefined();
  let matches = JSON.parse(matchesTextContent!);
  let matchesWithoutIds = matches.filter((match: any) => match.id == null);

  expect(matchesWithoutIds).toHaveLength(0);
});
