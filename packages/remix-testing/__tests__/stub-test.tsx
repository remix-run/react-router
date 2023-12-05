import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import { createRemixStub } from "@remix-run/testing";
import {
  Form,
  Outlet,
  useActionData,
  useFetcher,
  useLoaderData,
  useMatches,
} from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

test("renders a route", () => {
  let RemixStub = createRemixStub([
    {
      path: "/",
      Component: () => <div>HOME</div>,
    },
  ]);

  render(<RemixStub />);

  expect(screen.getByText("HOME")).toBeInTheDocument();
});

test("renders a nested route", () => {
  let RemixStub = createRemixStub([
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

  render(<RemixStub />);

  expect(screen.getByText("ROOT")).toBeInTheDocument();
  expect(screen.getByText("INDEX")).toBeInTheDocument();
});

test("loaders work", async () => {
  let RemixStub = createRemixStub([
    {
      path: "/",
      Component() {
        let data = useLoaderData();
        return <pre data-testid="data">Message: {data.message}</pre>;
      },
      loader() {
        return json({ message: "hello" });
      },
    },
  ]);

  render(<RemixStub />);

  await waitFor(() => screen.findByText("Message: hello"));
});

test("actions work", async () => {
  let RemixStub = createRemixStub([
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
        return json({ message: "hello" });
      },
    },
  ]);

  render(<RemixStub />);

  user.click(screen.getByText("Submit"));
  await waitFor(() => screen.findByText("Message: hello"));
});

test("fetchers work", async () => {
  let count = 0;
  let RemixStub = createRemixStub([
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
        return json({ count: ++count });
      },
    },
  ]);

  render(<RemixStub />);

  user.click(screen.getByText("idle 0"));
  await waitFor(() => screen.findByText("idle 1"));

  user.click(screen.getByText("idle 1"));
  await waitFor(() => screen.findByText("idle 2"));
});

test("can pass a predefined loader", () => {
  async function loader(_args: LoaderFunctionArgs) {
    return json({ hi: "there" });
  }

  createRemixStub([
    {
      path: "/example",
      loader,
    },
  ]);
});

test("can pass context values", async () => {
  let RemixStub = createRemixStub(
    [
      {
        path: "/",
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
          return json(context);
        },
        children: [
          {
            path: "hello",
            Component() {
              let data = useLoaderData() as { context: string };
              return <pre data-testid="hello">Context: {data.context}</pre>;
            },
            loader({ context }) {
              return json(context);
            },
          },
        ],
      },
    ],
    { context: "hello" }
  );

  render(<RemixStub initialEntries={["/hello"]} />);

  expect(await screen.findByTestId("root")).toHaveTextContent(
    /context: hello/i
  );
  expect(await screen.findByTestId("hello")).toHaveTextContent(
    /context: hello/i
  );
});

test("all routes have ids", () => {
  let RemixStub = createRemixStub([
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

  render(<RemixStub />);

  let matchesTextContent = screen.getByTestId("matches").textContent;
  // eslint-disable-next-line jest-dom/prefer-in-document
  expect(matchesTextContent).toBeDefined();
  let matches = JSON.parse(matchesTextContent!);
  let matchesWithoutIds = matches.filter((match: any) => match.id == null);

  expect(matchesWithoutIds).toHaveLength(0);
});
