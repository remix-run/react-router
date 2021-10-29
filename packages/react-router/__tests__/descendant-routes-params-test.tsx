import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useParams } from "react-router";

describe("Descendant <Routes>", () => {
  it("receive all params from ancestor <Routes>", () => {
    function ShowParams() {
      return <p>The params are {JSON.stringify(useParams())}</p>;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/users/mj/messages/123"]}>
          <Routes>
            <Route
              path="users/:userId/*"
              element={
                <Routes>
                  <Route path="messages/:messageId" element={<ShowParams />} />
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
        {"userId":"mj","*":"messages/123","messageId":"123"}
      </p>
    `);
  });

  it("overrides params of the same name from ancestor <Routes>", () => {
    function ShowParams() {
      return <p>The params are {JSON.stringify(useParams())}</p>;
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/users/mj/messages/123"]}>
          <Routes>
            <Route
              path="users/:id/*"
              element={
                <Routes>
                  <Route path="messages/:id" element={<ShowParams />} />
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
        {"id":"123","*":"messages/123"}
      </p>
    `);
  });
});
