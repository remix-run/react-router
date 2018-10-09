import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory as createHistory } from "history";

import MemoryRouter from "../MemoryRouter";
import Match from "../Match";
import Router from "../Router";

describe("A <Match>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("without a <Router>", () => {
    it("throws an error", () => {
      spyOn(console, "error");

      expect(() => {
        ReactDOM.render(<Match />, node);
      }).toThrow(/You should not use <Match> outside a <Router>/);
    });
  });

  it("renders when it matches", () => {
    const text = "cupcakes";

    ReactDOM.render(
      <MemoryRouter initialEntries={["/cupcakes"]}>
        <Match path="/cupcakes" render={() => <h1>{text}</h1>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(text);
  });

  it("renders when it matches at the root URL", () => {
    const text = "cupcakes";

    ReactDOM.render(
      <MemoryRouter initialEntries={["/"]}>
        <Match path="/" render={() => <h1>{text}</h1>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(text);
  });

  it("does not render when it does not match", () => {
    const text = "bubblegum";

    ReactDOM.render(
      <MemoryRouter initialEntries={["/bunnies"]}>
        <Match path="/flowers" render={() => <h1>{text}</h1>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain(text);
  });

  it("matches using nextContext when updating", () => {
    const history = createHistory({
      initialEntries: ["/sushi/california"]
    });

    ReactDOM.render(
      <Router history={history}>
        <Match
          path="/sushi/:roll"
          render={({ match }) => <h1>{match.url}</h1>}
        />
      </Router>,
      node
    );

    history.push("/sushi/spicy-tuna");

    expect(node.innerHTML).toContain("/sushi/spicy-tuna");
  });

  describe("with dynamic segments in the path", () => {
    it("decodes them", () => {
      ReactDOM.render(
        <MemoryRouter initialEntries={["/a%20dynamic%20segment"]}>
          <Match
            path="/:id"
            render={({ match }) => <h1>{match.params.id}</h1>}
          />
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain("a dynamic segment");
    });
  });

  describe("with a unicode path", () => {
    it("is able to match", () => {
      ReactDOM.render(
        <MemoryRouter initialEntries={["/パス名"]}>
          <Match path="/パス名" render={({ match }) => <h1>{match.url}</h1>} />
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain("/パス名");
    });
  });

  describe("with escaped special characters in the path", () => {
    it("is able to match", () => {
      ReactDOM.render(
        <MemoryRouter initialEntries={["/pizza (1)"]}>
          <Match
            path="/pizza \(1\)"
            render={({ match }) => <h1>{match.url}</h1>}
          />
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain("/pizza (1)");
    });
  });

  describe("with `exact=true`", () => {
    it("renders when the URL does not have a trailing slash", () => {
      const text = "bubblegum";

      ReactDOM.render(
        <MemoryRouter initialEntries={["/somepath/"]}>
          <Match exact path="/somepath" render={() => <h1>{text}</h1>} />
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain(text);
    });

    it("renders when the URL has trailing slash", () => {
      const text = "bubblegum";

      ReactDOM.render(
        <MemoryRouter initialEntries={["/somepath"]}>
          <Match exact path="/somepath/" render={() => <h1>{text}</h1>} />
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain(text);
    });

    describe("and `strict=true`", () => {
      it("does not render when the URL has a trailing slash", () => {
        const text = "bubblegum";

        ReactDOM.render(
          <MemoryRouter initialEntries={["/somepath/"]}>
            <Match
              exact
              strict
              path="/somepath"
              render={() => <h1>{text}</h1>}
            />
          </MemoryRouter>,
          node
        );

        expect(node.innerHTML).not.toContain(text);
      });

      it("does not render when the URL does not have a trailing slash", () => {
        const text = "bubblegum";

        ReactDOM.render(
          <MemoryRouter initialEntries={["/somepath"]}>
            <Match
              exact
              strict
              path="/somepath/"
              render={() => <h1>{text}</h1>}
            />
          </MemoryRouter>,
          node
        );

        expect(node.innerHTML).not.toContain(text);
      });
    });
  });

  describe("the `location` prop", () => {
    it("overrides `context.location`", () => {
      const text = "bubblegum";

      ReactDOM.render(
        <MemoryRouter initialEntries={["/cupcakes"]}>
          <Match
            location={{ pathname: "/bubblegum" }}
            path="/bubblegum"
            render={() => <h1>{text}</h1>}
          />
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

        ReactDOM.render(
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

    describe("that is a function", () => {
      it("receives { history, location, match } props", () => {
        const history = createHistory();

        let props = null;
        ReactDOM.render(
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

        ReactDOM.render(
          <MemoryRouter initialEntries={["/"]}>
            <Match path="/" children={() => <h1>{text}</h1>} />
          </MemoryRouter>,
          node
        );

        expect(node.innerHTML).toContain(text);
      });

      describe("that returns `undefined`", () => {
        it("logs a warning to the console and renders nothing", () => {
          spyOn(console, "error");

          ReactDOM.render(
            <MemoryRouter initialEntries={["/"]}>
              <Match path="/" children={() => undefined} />
            </MemoryRouter>,
            node
          );

          expect(node.innerHTML).toEqual("");

          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
              "You returned `undefined` from the `children` function"
            )
          );
        });
      });
    });

    describe("that is an empty array (as in Preact)", () => {
      it("ignores the children", () => {
        const text = "bubblegum";

        ReactDOM.render(
          <MemoryRouter>
            <Match render={() => <h1>{text}</h1>}>{[]}</Match>
          </MemoryRouter>,
          node
        );

        expect(node.innerHTML).toContain(text);
      });
    });

    describe("that doesn't match path", () => {
      it("doesn't render `children` function", () => {
        const text = "bubblegum";

        ReactDOM.render(
          <MemoryRouter initialEntries={["/"]}>
            <Match path="/no" children={() => <h1>{text}</h1>} />
          </MemoryRouter>,
          node
        );

        expect(node.innerHTML).not.toContain(text);
      });
      it("doesn't render `children` node", () => {
        const text = "bubblegum";

        ReactDOM.render(
          <MemoryRouter initialEntries={["/"]}>
            <Match path="/no" children={text} />
          </MemoryRouter>,
          node
        );

        expect(node.innerHTML).not.toContain(text);
      });
      it("doesn't render `render` prop", () => {
        const text = "bubblegum";

        ReactDOM.render(
          <MemoryRouter initialEntries={["/"]}>
            <Match path="/no" render={() => <h1>{text}</h1>} />
          </MemoryRouter>,
          node
        );

        expect(node.innerHTML).not.toContain(text);
      });
    });
  });

  describe("the `component` prop", () => {
    it("renders the component", () => {
      const text = "bubblegum";

      const Home = () => <h1>{text}</h1>;

      ReactDOM.render(
        <MemoryRouter initialEntries={["/"]}>
          <Match path="/" component={Home} />
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain(text);
    });

    it("receives { history, location, match } props", () => {
      const history = createHistory();

      let props = null;
      const Component = p => {
        props = p;
        return null;
      };

      ReactDOM.render(
        <Router history={history}>
          <Match path="/" component={Component} />
        </Router>,
        node
      );

      expect(props).not.toBe(null);
      expect(props.history).toBe(history);
      expect(typeof props.location).toBe("object");
      expect(typeof props.match).toBe("object");
    });
  });

  describe("the `render` prop", () => {
    it("renders its return value", () => {
      const text = "Mrs. Kato";

      ReactDOM.render(
        <MemoryRouter initialEntries={["/"]}>
          <Match path="/" render={() => <h1>{text}</h1>} />
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain(text);
    });

    it("receives { history, location, match } props", () => {
      const history = createHistory();

      let props = null;
      ReactDOM.render(
        <Router history={history}>
          <Match
            path="/"
            render={p => {
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
  });
});
