import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  createMemoryRouter,
  RouterProvider,
  UNSAFE_WithComponentProps,
} from "react-router";

describe("WithComponentProps", () => {
  test("adds route props to a deferred React Server DOM child", async () => {
    function Child({ loaderData }: { loaderData: { message: string } }) {
      return <p id="route-component">{loaderData.message}</p>;
    }

    // React Server DOM can represent a deferred element with this lazy chunk shape.
    const deferredChild = {
      $$typeof: Symbol.for("react.lazy"),
      _payload: { status: "resolved_model" },
      _init: () => <Child />,
    } as unknown as React.ReactElement;

    const router = createMemoryRouter(
      [
        {
          id: "root",
          path: "/",
          loader: () => ({ message: "loader data" }),
          HydrateFallback: () => null,
          element: React.createElement(UNSAFE_WithComponentProps, {
            children: deferredChild,
          }),
        },
      ],
      { initialEntries: ["/"] },
    );

    let renderer: TestRenderer.ReactTestRenderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(<RouterProvider router={router} />);
    });

    expect(
      renderer!.root.findByProps({ id: "route-component" }).children,
    ).toEqual(["loader data"]);

    TestRenderer.act(() => renderer!.unmount());
    router.dispose();
  });
});
