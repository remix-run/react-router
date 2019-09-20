import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Route, useParams, useRouteMatch } from "react-router";

import renderStrict from "./utils/renderStrict.js";

describe("useParams", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("when the path has no params", () => {
    it("returns an empty hash", () => {
      let params;

      function HomePage() {
        params = useParams();
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

      expect(typeof params).toBe("object");
      expect(Object.keys(params)).toHaveLength(0);
    });
  });

  describe("when the path has some params", () => {
    it("returns a hash of the URL params and their values", () => {
      let params;

      function BlogPost() {
        params = useParams();
        return null;
      }

      renderStrict(
        <MemoryRouter initialEntries={["/blog/cupcakes"]}>
          <Route path="/blog/:slug">
            <BlogPost />
          </Route>
        </MemoryRouter>,
        node
      );

      expect(typeof params).toBe("object");
      expect(params).toMatchObject({
        slug: "cupcakes"
      });
    });

    describe("a child route", () => {
      it("returns a combined hash of the parent and child params", () => {
        let params;

        function Course() {
          params = useParams();
          return null;
        }

        function Users() {
          const match = useRouteMatch();
          return (
            <div>
              <h1>Users</h1>
              <Route path={`${match.path}/courses/:course`}>
                <Course />
              </Route>
            </div>
          );
        }

        renderStrict(
          <MemoryRouter
            initialEntries={["/users/mjackson/courses/react-router"]}
          >
            <Route path="/users/:username">
              <Users />
            </Route>
          </MemoryRouter>,
          node
        );

        expect(typeof params).toBe("object");
        expect(params).toMatchObject({
          username: "mjackson",
          course: "react-router"
        });
      });
    });
  });
});
