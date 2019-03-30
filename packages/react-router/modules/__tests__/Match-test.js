import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory as createHistory } from "history";
import { MemoryRouter, Router, Match } from "react-router";

import renderStrict from "./utils/renderStrict";

describe("A <Match>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("passes props to class component child", () => {
    class MatchedRoute extends React.Component {
      render() {
        return <div> {this.props.match && this.props.match.url} </div>;
      }
    }

    renderStrict(
      <MemoryRouter initialEntries={["/pizza"]}>
        <Match path="/pizza">
          <MatchedRoute />
        </Match>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("/pizza");
  });

  describe("without a <Router>", () => {
    it("throws an error", () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderStrict(<Match />, node);
      }).toThrow(/You should not use <Match> outside a <Router>/);
    });
  });

  it("renders when it matches", () => {
    const text = "cupcakes";

    renderStrict(
      <MemoryRouter initialEntries={["/cupcakes"]}>
        <Match path="/cupcakes">
          {" "}
          <h1>{text}</h1>{" "}
        </Match>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(text);
  });

  it("also renders when it does not match", () => {
    const text = "bubblegum";

    renderStrict(
      <MemoryRouter initialEntries={["/bunnies"]}>
        <Match path="/flowers">
          {" "}
          <h1>{text}</h1>}{" "}
        </Match>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(text);
  });

  it("matches using nextContext when updating", () => {
    const history = createHistory({
      initialEntries: ["/sushi/california"]
    });

    renderStrict(
      <Router history={history}>
        <Match path="/sushi/:roll">{({ match }) => <h1>{match.url}</h1>}</Match>
      </Router>,
      node
    );

    history.push("/sushi/spicy-tuna");

    expect(node.innerHTML).toContain("/sushi/spicy-tuna");
  });

  describe("with dynamic segments in the path", () => {
    it("decodes them", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/a%20dynamic%20segment"]}>
          <Match path="/:id">{({ match }) => <h1>{match.params.id}</h1>}</Match>
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain("a dynamic segment");
    });
  });

  describe("with an array of paths", () => {
    it("matches the first provided path", () => {
      const node = document.createElement("div");
      ReactDOM.render(
        <MemoryRouter initialEntries={["/hello"]}>
          <Match path={["/hello", "/world"]}>
            {() => <div>Hello World</div>}
          </Match>
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain("Hello World");
    });

    it("matches other provided paths", () => {
      const node = document.createElement("div");
      ReactDOM.render(
        <MemoryRouter initialEntries={["/other", "/world"]} initialIndex={1}>
          <Match path={["/hello", "/world"]}>
            {() => <div>Hello World</div>}
          </Match>
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain("Hello World");
    });

    it("provides the matched path as a string", () => {
      const node = document.createElement("div");
      ReactDOM.render(
        <MemoryRouter initialEntries={["/other", "/world"]} initialIndex={1}>
          <Match path={["/hello", "/world"]}>
            {({ match }) => <div>{match.path}</div>}
          </Match>
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain("/world");
    });

    it("doesn't remount when moving from one matching path to another", () => {
      const node = document.createElement("div");
      const history = createHistory();
      const mount = jest.fn();
      class MatchedRoute extends React.Component {
        componentWillMount() {
          mount();
        }

        render() {
          return <div>Hello World</div>;
        }
      }
      history.push("/hello");
      ReactDOM.render(
        <Router history={history}>
          <Match path={["/hello", "/world"]}>
            <MatchedRoute />
          </Match>
        </Router>,
        node
      );

      expect(mount).toHaveBeenCalledTimes(1);
      expect(node.innerHTML).toContain("Hello World");

      history.push("/world/somewhere/else");

      expect(mount).toHaveBeenCalledTimes(1);
      expect(node.innerHTML).toContain("Hello World");
    });
  });

  describe("with a unicode path", () => {
    it("is able to match", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/パス名"]}>
          <Match path="/パス名">{({ match }) => <h1> {match.url} </h1>}</Match>
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain("/パス名");
    });
  });

  describe("with escaped special characters in the path", () => {
    it("is able to match", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza (1)"]}>
          <Match path="/pizza \(1\)">
            {({ match }) => <h1>{match.url}</h1>}
          </Match>
          />
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain("/pizza (1)");
    });
  });

  describe("the `location` prop", () => {
    it("overrides `context.location`", () => {
      const text = "bubblegum";

      renderStrict(
        <MemoryRouter initialEntries={["/cupcakes"]}>
          <Match location={{ pathname: "/bubblegum" }} path="/bubblegum">
            {({ match }) => <h1>{match ? text : null}</h1>}
          </Match>
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain(text);
    });
  });

  describe("the `children` prop", () => {
    describe("that is an element", () => {
      it("renders", () => {
        const text = "bubblegum";

        renderStrict(
          <MemoryRouter initialEntries={["/"]}>
            <Match path="/">
              <h1>{text}</h1>
            </Match>
          </MemoryRouter>,
          node
        );

        expect(node.innerHTML).toContain(text);
      });
    });

    describe("that is a functional component react child", () => {
      it("receives { history, location, match } props", () => {
        const history = createHistory();
        let props = null;

        const PropChecker = p => {
          props = p;
          return null;
        };

        renderStrict(
          <Router history={history}>
            <Match path="/">
              <PropChecker />
            </Match>
          </Router>,
          node
        );

        expect(props).not.toBe(null);
        expect(props.history).toBe(history);
        expect(typeof props.location).toBe("object");
        expect(typeof props.match).toBe("object");
      });
    });

    describe("that is a class component react child", () => {
      it("receives { history, location, match } props", () => {
        const history = createHistory();
        let props = null;

        class PropChecker extends React.Component {
          componentDidMount() {
            props = this.props;
          }

          render() {
            return null;
          }
        }

        renderStrict(
          <Router history={history}>
            <Match path="/">
              <PropChecker />
            </Match>
          </Router>,
          node
        );

        expect(props).not.toBe(null);
        expect(props.history).toBe(history);
        expect(typeof props.location).toBe("object");
        expect(typeof props.match).toBe("object");
      });
    });

    describe("that is a function", () => {
      it("receives { history, location, match } props", () => {
        const history = createHistory();

        let props = null;
        renderStrict(
          <Router history={history}>
            <Match
              path="/"
              children={p => {
                props = p;
                return null;
              }}
            />
          </Router>,
          node
        );

        expect(props).not.toBe(null);
        expect(props.history).toBe(history);
        expect(typeof props.location).toBe("object");
        expect(typeof props.match).toBe("object");
      });

      it("renders", () => {
        const text = "bubblegum";

        renderStrict(
          <MemoryRouter initialEntries={["/"]}>
            <Match path="/" children={() => <h1>{text}</h1>} />
          </MemoryRouter>,
          node
        );

        expect(node.innerHTML).toContain(text);
      });

      describe("that returns `undefined`", () => {
        it("logs a warning to the console and renders nothing", () => {
          jest.spyOn(console, "warn").mockImplementation(() => {});

          renderStrict(
            <MemoryRouter initialEntries={["/"]}>
              <Match path="/" children={() => undefined} />
            </MemoryRouter>,
            node
          );

          expect(node.innerHTML).toEqual("");

          expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining(
              "You returned `undefined` from the `children` function"
            )
          );
        });
      });
    });
  });
});
