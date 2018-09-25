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
    it("throws", () => {
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

    expect(node.innerHTML).toMatch(/one/);
  });

  it("renders the first <Redirect from> that matches the URL", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/three"]}>
        <Switch>
          <Route path="/one" render={() => <h1>one</h1>} />
          <Redirect from="/four" to="/one" />
          <Redirect from="/three" to="/two" />
          <Route path="/two" render={() => <h1>two</h1>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toMatch(/two/);
  });

  it("does not render a second <Route> or <Redirect> that also matches the URL", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Route path="/one" render={() => <h1>one</h1>} />
          <Redirect from="/one" to="/two" />
          <Route path="/one" render={() => <h1>two</h1>} />
          <Route path="/two" render={() => <h1>two</h1>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toMatch(/two/);
  });

  it("renders pathless Routes", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/cupcakes"]}>
        <Switch>
          <Route path="/bubblegum" render={() => <div>one</div>} />
          <Route render={() => <div>two</div>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain("one");
    expect(node.innerHTML).toContain("two");
  });

  it("handles from-less Redirects", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/cupcakes"]}>
        <Switch>
          <Route path="/bubblegum" render={() => <div>bub</div>} />
          <Redirect to="/bubblegum" />
          <Route path="/cupcakes" render={() => <div>cup</div>} />
        </Switch>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain("cup");
    expect(node.innerHTML).toContain("bub");
  });

  it("handles subsequent redirects", () => {
    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Switch>
          <Redirect exact from="/one" to="/two" />
          <Redirect exact from="/two" to="/three" />

          <Route path="/three" render={() => <div>three</div>} />
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
