import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter as Router, Routes, Route, useParams } from "react-router";

describe("Descendant <Routes>", () => {
  it("receive all params from ancestor <Routes>", () => {
    function Message() {
      return <p>The params are {JSON.stringify(useParams())}</p>;
    }

    function User() {
      return (
        <Routes>
          <Route path="messages/:messageId" element={<Message />} />
        </Routes>
      );
    }

    let renderer = createTestRenderer(
      <Router initialEntries={["/users/mj/messages/123"]}>
        <Routes>
          <Route path="users/:userId/*" element={<User />} />
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <p>
        The params are 
        {"userId":"mj","*":"messages/123","messageId":"123"}
      </p>
    `);
  });
});
