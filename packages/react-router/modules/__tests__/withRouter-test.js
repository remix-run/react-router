import React from "react";
import ReactDOM from "react-dom";

import { MemoryRouter, StaticRouter, Route, withRouter } from "react-router";

import renderStrict from "./utils/renderStrict";

describe("withRouter", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("provides { match, location, history } props", () => {
    let props;

    const PropsChecker = withRouter(p => {
      props = p;
      return null;
    });

    renderStrict(
      <MemoryRouter>
        <PropsChecker />
      </MemoryRouter>,
      node
    );

    expect(typeof props).toBe("object");
    expect(typeof props.match).toBe("object");
    expect(typeof props.location).toBe("object");
    expect(typeof props.history).toBe("object");
  });

  it("provides the parent match as a prop to the wrapped component", () => {
    let parentMatch, props;

    const PropsChecker = withRouter(p => {
      props = p;
      return null;
    });

    renderStrict(
      <MemoryRouter initialEntries={["/bubblegum"]}>
        <Route
          path="/:flavor"
          render={({ match }) => {
            parentMatch = match;
            return <PropsChecker />;
          }}
        />
      </MemoryRouter>,
      node
    );

    expect(typeof parentMatch).toBe("object");
    expect(typeof props).toBe("object");
    expect(props.match).toBe(parentMatch);
  });

  it("works when parent match is null", () => {
    let parentMatch, props;

    const PropChecker = withRouter(p => {
      props = p;
      return null;
    });

    renderStrict(
      <MemoryRouter initialEntries={["/somepath"]}>
        <Route
          path="/no-match"
          children={({ match }) => {
            parentMatch = match;
            return <PropChecker />;
          }}
        />
      </MemoryRouter>,
      node
    );

    expect(parentMatch).toBe(null);
    expect(typeof props).toBe("object");
    expect(props.match).toBe(null);
  });

  describe("inside a <StaticRouter>", () => {
    it("provides the staticContext prop", () => {
      let props;

      const PropsChecker = withRouter(p => {
        props = p;
        return null;
      });

      const context = {};

      renderStrict(
        <StaticRouter context={context}>
          <Route component={PropsChecker} />
        </StaticRouter>,
        node
      );

      expect(typeof props).toBe("object");
      expect(typeof props.staticContext).toBe("object");
      expect(props.staticContext).toBe(context);
    });
  });

  it("exposes the wrapped component as WrappedComponent", () => {
    const Component = () => <div />;
    const decorated = withRouter(Component);
    expect(decorated.WrappedComponent).toBe(Component);
  });

  it("exposes the instance of the wrapped component via wrappedComponentRef", () => {
    class WrappedComponent extends React.Component {
      render() {
        return null;
      }
    }
    const Component = withRouter(WrappedComponent);

    let ref;
    renderStrict(
      <MemoryRouter initialEntries={["/bubblegum"]}>
        <Route
          path="/bubblegum"
          render={() => <Component wrappedComponentRef={r => (ref = r)} />}
        />
      </MemoryRouter>,
      node
    );

    expect(ref instanceof WrappedComponent).toBe(true);
  });

  it("hoists non-react statics from the wrapped component", () => {
    class Component extends React.Component {
      static foo() {
        return "bar";
      }

      render() {
        return null;
      }
    }
    Component.hello = "world";

    const decorated = withRouter(Component);

    expect(decorated.hello).toBe("world");
    expect(typeof decorated.foo).toBe("function");
    expect(decorated.foo()).toBe("bar");
  });
});
