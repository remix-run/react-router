import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Route, useQueryString } from "react-router";

import renderStrict from "./utils/renderStrict.js";

describe("useQueryString", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("when the path has no queryString", () => {
    it("returns an empty hash", () => {
      let queryObject;

      function HomePage() {
        queryObject = useQueryString();
        return null;
      }

      renderStrict(
        <MemoryRouter initialEntries={["/home"]}>
          <Route path="/home">
            <HomePage />
          </Route>
        </MemoryRouter>,
        node
      );

      expect(typeof queryObject).toBe("object");
      expect(Object.keys(queryObject)).toHaveLength(0);
    });
  });

  describe("when the path has some queryString", () => {
    it("returns a hash of the URL queryString and their values", () => {
      let queryObject;

      function BlogPost() {
        queryObject = useQueryString();
        return null;
      }

      renderStrict(
        <MemoryRouter initialEntries={["/blog?page=1&pageSize=20"]}>
          <Route
            location={{ pathname: "/blog", search: "?page=1&pageSize=20" }}
          >
            <BlogPost />
          </Route>
        </MemoryRouter>,
        node
      );

      expect(typeof queryObject).toBe("object");
      expect(queryObject).toMatchObject({
        page: "1",
        pageSize: "20"
      });
    });
  });

  describe("when the route isn't matched", () => {
    it("returns empty object", () => {
      let queryObject;

      function HomePage() {
        queryObject = useQueryString();
        return null;
      }

      renderStrict(
        <MemoryRouter initialEntries={["/home"]}>
          <Route path="/not-the-current-route" children={() => <HomePage />} />
        </MemoryRouter>,
        node
      );

      expect(typeof queryObject).toBe("object");
      expect(Object.keys(queryObject)).toHaveLength(0);
    });
  });
});
