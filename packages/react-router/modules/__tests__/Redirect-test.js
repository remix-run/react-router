import React from "react";
import ReactDOM from "react-dom";
import MemoryRouter from "../MemoryRouter";
import Redirect from "../Redirect";
import Route from "../Route";
import Switch from "../Switch";

describe("A <Redirect>", () => {
  describe("inside a <Switch>", () => {
    it("automatically interpolates params", () => {
      const node = document.createElement("div");

      let params;

      ReactDOM.render(
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

  describe("A <Redirect enabled>", () => {
    it("follow redirect if enabled", () => {
      const node = document.createElement("div");

      ReactDOM.render(
        <MemoryRouter initialEntries={["/initialroute"]}>
          <Switch>
            <Route path="/redirectto" render={() => <h1>one</h1>} />
            <Route>
              <Redirect enabled={true} from="/initialroute" to="/redirectto" />
            </Route>
          </Switch>
        </MemoryRouter>,
        node
      );
      expect(node.innerHTML).toMatch(/one/);
    });

    it("default is to be enabled", () => {
      const node = document.createElement("div");

      ReactDOM.render(
        <MemoryRouter initialEntries={["/initialroute"]}>
          <Switch>
            <Route path="/redirectto" render={() => <h1>one</h1>} />
            <Route>
              <Redirect from="/initialroute" to="/redirectto" />
            </Route>
          </Switch>
        </MemoryRouter>,
        node
      );
      expect(node.innerHTML).toMatch(/one/);
    });

    it("not follow redirect if not enabled", () => {
      const node = document.createElement("div");
      ReactDOM.render(
        <MemoryRouter initialEntries={["/initialroute"]}>
          <Switch>
            <Route path="/redirectto" render={() => <h1>one</h1>} />
            <Route>
              <Redirect enabled={false} from="/initialroute" to="/redirectto" />
            </Route>
          </Switch>
        </MemoryRouter>,
        node
      );
      expect(node.innerHTML).not.toMatch(/one/);
    });
  });
});
