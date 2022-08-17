import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useCreateHref } from "react-router";

function ShowHref({ to }: { to: string }) {
  const createHref = useCreateHref();
  return <pre>{createHref(to)}</pre>;
}

describe("useCreateHref", () => {
  describe("to a child route", () => {
    it("returns the correct href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/courses"]}>
            <Routes>
              <Route
                path="courses"
                element={<ShowHref to="advanced-react" />}
              />
            </Routes>
          </MemoryRouter>
        );
      });

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <pre>
          /courses/advanced-react
        </pre>
      `);
    });
  });
});
