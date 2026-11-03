import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  RouterProvider,
  createBrowserRouter,
  useFetcher,
  UNSAFE_DataRouterContext,
} from "../../index";
import getWindow from "../utils/getWindow";

describe("fetcher.data effect timing with concurrent transitions (#15724)", () => {
  it("runs effects on fetcher.data even when intermediate renders occur before transition commit", async () => {
    let seenByEffect: string | null = null;
    let effectCount = 0;

    function TestComponent() {
      let fetcher = useFetcher<{ token: string }>();
      let token = fetcher.data?.token ?? null;

      React.useEffect(() => {
        fetcher.load("/token");
      }, []);

      React.useEffect(() => {
        seenByEffect = token;
        if (token) {
          effectCount++;
        }
      }, [token]);

      // Simulate an intermediate subscription / no-op render triggered on router update
      let router = React.useContext(UNSAFE_DataRouterContext)?.router;
      let [, setTick] = React.useState(0);
      React.useEffect(() => {
        return router?.subscribe(() => {
          setTick(1);
          setTick(0);
        });
      }, [router]);

      return (
        <div>
          <div data-testid="token">{token ?? "none"}</div>
          <div data-testid="effect">{seenByEffect ?? "none"}</div>
        </div>
      );
    }

    let router = createBrowserRouter(
      [
        {
          path: "/",
          Component: TestComponent,
        },
        {
          path: "/token",
          loader() {
            return { token: "secret-token-123" };
          },
        },
      ],
      {
        window: getWindow("/"),
      },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("secret-token-123");
      expect(screen.getByTestId("effect")).toHaveTextContent("secret-token-123");
    });

    expect(seenByEffect).toBe("secret-token-123");
    expect(effectCount).toBe(1);
  });
});
