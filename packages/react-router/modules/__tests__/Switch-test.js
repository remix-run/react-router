import React from "react";
import ReactDOM from "react-dom";

import { MemoryRouter, Route, Redirect, Switch } from "react-router";

describe("A <Switch>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("without a <Router>", () => {
    it("throws an error", () => {
      spyOn(console, "error");

      expect(() => {
        ReactDOM.render(<Switch />, node);
      }).toThrow(/You should not use <Switch> outside a <Router>/);
    });
  });

  it("renders the first <Route> that matches the URL", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Route path="/one" render={() => <h1>one</h1>} />
          <Route path="/two" render={() => <h1>two</h1>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("one");
  });

  it("does not render a second <Route> that also matches the URL", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Route path="/one" render={() => <h1>one</h1>} />
          <Route path="/one" render={() => <h1>two</h1>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain("two");
  });

  it("renders the first <Redirect> that matches the URL", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/three"]}>
        <Switch>
          <Route path="/one" render={() => <h1>one</h1>} />
          <Route path="/two" render={() => <h1>two</h1>} />
          <Redirect from="/three" to="/two" />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("two");
  });

  it("does not render a second <Redirect> that also matches the URL", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/three"]}>
        <Switch>
          <Route path="/one" render={() => <h1>one</h1>} />
          <Route path="/two" render={() => <h1>two</h1>} />
          <Redirect from="/three" to="/two" />
          <Redirect from="/three" to="/one" />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("two");
  });

  it("renders a Route with no `path` prop", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/two"]}>
        <Switch>
          <Route path="/one" render={() => <h1>one</h1>} />
          <Route render={() => <h1>two</h1>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("two");
  });

  it("renders a Redirect with no `from` prop", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/three"]}>
        <Switch>
          <Route path="/one" render={() => <h1>one</h1>} />
          <Redirect to="/one" />
          <Route path="/two" render={() => <h1>two</h1>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("one");
  });

  it("handles subsequent redirects", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Redirect from="/one" to="/two" />
          <Redirect from="/two" to="/three" />
          <Route path="/three" render={() => <h1>three</h1>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("three");
  });

  it("handles comments", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/cupcakes"]}>
        <Switch>
          <Route path="/bubblegum" render={() => <div>bub</div>} />
          {/* this is a comment */}
          <Route path="/cupcakes" render={() => <div>cup</div>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain("bub");
    expect(node.innerHTML).toContain("cup");
  });

  it("renders with non-element children", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Route path="/one" render={() => <h1>one</h1>} />
          {false}
          {undefined}
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toMatch(/one/);
  });

  it("can use a `location` prop instead of `router.location`", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch location={{ pathname: "/two" }}>
          <Route path="/one" render={() => <h1>one</h1>} />
          <Route path="/two" render={() => <h1>two</h1>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toMatch(/two/);
  });
});
