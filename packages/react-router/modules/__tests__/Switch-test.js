import React from "react";
import ReactDOM from "react-dom";

import MemoryRouter from "../MemoryRouter";
import Route from "../Route";
import Redirect from "../Redirect";
import Switch from "../Switch";

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

  it("warns when redirecting to same route, both strings", () => {
    let redirected = false;
    let done = false;

    spyOn(console, "error");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Route
            path="/one"
            render={() => {
              if (done) return <h1>done</h1>;

              if (!redirected) {
                return <Redirect to="/one" />;
              }
              done = true;

              return <Redirect to="/one" />;
            }}
          />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain("done");

    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Warning:.*"\/one"/)
    );
  });

  it("warns when redirecting to same route, mixed types", () => {
    let redirected = false;
    let done = false;

    spyOn(console, "error");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Route
            path="/one"
            render={() => {
              if (done) return <h1>done</h1>;

              if (!redirected) {
                redirected = true;
                return <Redirect to="/one" />;
              }
              done = true;

              return <Redirect to={{ pathname: "/one" }} />;
            }}
          />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain("done");

    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Warning:.*"\/one"/)
    );
  });

  it("warns when redirecting to same route, mixed types, string with query", () => {
    let redirected = false;
    let done = false;

    spyOn(console, "error");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Route
            path="/one"
            render={() => {
              if (done) return <h1>done</h1>;

              if (!redirected) {
                redirected = true;
                return <Redirect to="/one?utm=1" />;
              }
              done = true;

              return <Redirect to={{ pathname: "/one", search: "?utm=1" }} />;
            }}
          />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain("done");

    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Warning:.*"\/one\?utm=1"/)
    );
  });

  it("does NOT warn when redirecting to same route with different `search`", () => {
    let redirected = false;
    let done = false;

    spyOn(console, "error");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Route
            path="/one"
            render={() => {
              if (done) return <h1>done</h1>;

              if (!redirected) {
                redirected = true;
                return <Redirect to={{ pathname: "/one", search: "?utm=1" }} />;
              }
              done = true;

              return <Redirect to={{ pathname: "/one", search: "?utm=2" }} />;
            }}
          />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("done");
    expect(console.error.calls.count()).toBe(0);
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
