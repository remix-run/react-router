import React from "react";
import ReactDOM from "react-dom";
import { MemoryRouter, Redirect, Route, Switch } from "react-router";
import { createLocation } from "history";
import renderStrict from "./utils/renderStrict";

describe("A <Redirect>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("that always renders", () => {
    it("doesn't break / throw when rendered with string `to`", () => {
      expect(() => {
        renderStrict(
          <MemoryRouter>
            <Redirect to="go-out" />
          </MemoryRouter>,
          node
        );
      }).not.toThrow();
    });

    it("doesn't break / throw when rendered with location `to`", () => {
      const to = createLocation("/go-out?search=foo#hash");
      expect(() => {
        renderStrict(
          <MemoryRouter>
            <Redirect to={to} />
          </MemoryRouter>,
          node
        );
      }).not.toThrow();
    });
  });

  describe("inside a <Switch>", () => {
    it("automatically interpolates params", () => {
      let params;

      renderStrict(
        <MemoryRouter initialEntries={["/users/mjackson/messages/123"]}>
          <Switch>
            <Redirect
              from="/users/:username/messages/:messageId"
              to="/:username/messages/:messageId"
            />
            <Route
              path="/:username/messages/:messageId"
              render={({ match }) => {
                params = match.params;
                return null;
              }}
            />
          </Switch>
        </MemoryRouter>,
        node
      );

      expect(params).toMatchObject({
        username: "mjackson",
        messageId: "123"
      });
    });
  });
});
