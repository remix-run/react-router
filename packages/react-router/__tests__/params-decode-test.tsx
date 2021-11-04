import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useParams } from "react-router";

describe("Decoding params", () => {
  it("works", () => {
    function Content() {
      return <p>The params are {JSON.stringify(useParams())}</p>;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/content/%2F"]}>
          <Routes>
            <Route
              path="content/*"
              element={
                <Routes>
                  <Route path=":id" element={<Content />} />
                </Routes>
              }
            />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <p>
        The params are 
        {"*":"/","id":"/"}
      </p>
    `);
  });
});
