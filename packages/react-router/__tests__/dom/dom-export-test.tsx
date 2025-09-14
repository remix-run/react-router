import * as React from "react";

import { render, screen } from "@testing-library/react";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";

describe("react-router/dom", () => {
  function ShowParams() {
    return <pre data-testid="params">{JSON.stringify(useParams())}</pre>;
  }

  describe("Does not bundle react-router causing duplicate context issues", () => {
    it("with route provider shows the url params", async () => {
      const router = createMemoryRouter(
        [
          {
            path: "/blog/:slug",
            element: <ShowParams />,
          },
        ],
        {
          initialEntries: ["/blog/react-router"],
        },
      );

      // When react-router was bundled in CJS scenarios, this `react-router/dom`
      // version of `RouterProvider` caused duplicate contexts and we would not
      // find the param values
      render(<RouterProvider router={router} />);

      expect(await screen.findByTestId("params")).toMatchInlineSnapshot(`
      <pre
        data-testid="params"
      >
        {"slug":"react-router"}
      </pre>
    `);
    });
  });
});
