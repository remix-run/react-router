import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { Link } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";

describe("A <Link> in a <StaticRouter>", () => {
  describe("with a string", () => {
    it("uses the right href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <StaticRouter location="/">
            <Link to="mjackson" />
          </StaticRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/mjackson");
    });

    it("uses the right href with a basename", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <StaticRouter location="/base" basename="/base">
            <Link to="mjackson" />
          </StaticRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual(
        "/base/mjackson"
      );
    });
  });

  describe("with an object", () => {
    it("uses the right href", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <StaticRouter location="/">
            <Link to={{ pathname: "/mjackson" }} />
          </StaticRouter>
        );
      });

      expect(renderer.root.findByType("a").props.href).toEqual("/mjackson");
    });
  });
});
