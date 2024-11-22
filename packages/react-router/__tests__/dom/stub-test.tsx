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
} from "../../index";

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
  let RoutesStub = createRoutesStub(
    [
      {
        path: "/",
        HydrateFallback: () => null,
        Component() {
          let data = useLoaderData() as { context: string };
          return (
            <div>
              <pre data-testid="root">Context: {data.context}</pre>
              <Outlet />
            </div>
          );
        },
        loader({ context }) {
          return Response.json(context);
        },
        children: [
          {
            path: "hello",
            Component() {
              let data = useLoaderData() as { context: string };
              return <pre data-testid="hello">Context: {data.context}</pre>;
            },
            loader({ context }) {
              return Response.json(context);
            },
          },
        ],
      },
    ],
    { context: "hello" }
  );

  render(<RoutesStub initialEntries={["/hello"]} />);

  expect(await screen.findByTestId("root")).toHaveTextContent(
    /context: hello/i
  );
  expect(await screen.findByTestId("hello")).toHaveTextContent(
    /context: hello/i
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
