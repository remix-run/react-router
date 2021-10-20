import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { Link } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";

describe("A <Link> in a <StaticRouter>", () => {
  describe("with a string", () => {
    it("uses the right href", () => {
      let renderer = createTestRenderer(
        <StaticRouter location="/">
          <Link to="mjackson" />
        </StaticRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.href).toEqual("/mjackson");
    });
  });

  describe("with an object", () => {
    it("uses the right href", () => {
      let renderer = createTestRenderer(
        <StaticRouter location="/">
          <Link to={{ pathname: "/mjackson" }} />
        </StaticRouter>
      );

      let anchor = renderer.root.findByType("a");

      expect(anchor.props.href).toEqual("/mjackson");
    });
  });
});
