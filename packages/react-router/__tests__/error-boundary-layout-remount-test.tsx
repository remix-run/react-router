import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "../index";

describe("RenderErrorBoundary", () => {
  it("keeps ancestor layouts mounted when a data error surfaces", async () => {
    let mountCount = 0;

    function Layout({ children }: { children: React.ReactNode }) {
      React.useEffect(() => {
        mountCount += 1;
      }, []);
      return (
        <div>
          <h1>Layout</h1>
          {children}
        </div>
      );
    }

    let router = createMemoryRouter([
      {
        path: "/",
        element: (
          <Layout>
            <Outlet />
          </Layout>
        ),
        errorElement: (
          <Layout>
            <p>Error!</p>
          </Layout>
        ),
        children: [
          { index: true, element: <h2>Home</h2> },
          {
            path: "bad",
            loader() {
              throw new Error("Kaboom!");
            },
            element: <h2>Bad</h2>,
          },
        ],
      },
    ]);
    render(<RouterProvider router={router} />);

    await waitFor(() => screen.getByText("Home"));
    expect(mountCount).toBe(1);

    router.navigate("/bad");
    await waitFor(() => screen.getByText("Error!"));
    expect(mountCount).toBe(1);

    router.navigate("/");
    await waitFor(() => screen.getByText("Home"));
    expect(mountCount).toBe(1);
  });
});
