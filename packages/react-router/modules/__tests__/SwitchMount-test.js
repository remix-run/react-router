import React from "react";
import ReactDOM from "react-dom";

import { MemoryRouter, Route, Switch } from "react-router";

import renderStrict from "./utils/renderStrict";

describe("A <Switch>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("does not remount a <Route>'s component", () => {
    let mountCount = 0;
    let push;

    class MountCounter extends React.Component {
      componentDidMount() {
        push = this.props.history.push;
        mountCount++;
      }

      render() {
        return null;
      }
    }

    renderStrict(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Route path="/one" component={MountCounter} />
          <Route path="/two" component={MountCounter} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(mountCount).toBe(1);
    push("/two");

    expect(mountCount).toBe(1);
    push("/one");

    expect(mountCount).toBe(1);
  });
});
