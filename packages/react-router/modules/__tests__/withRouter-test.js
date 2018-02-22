import React from "react";
import ReactDOM from "react-dom";
import MemoryRouter from "../MemoryRouter";
import StaticRouter from "../StaticRouter";
import Route from "../Route";
import withRouter from "../withRouter";

describe("withRouter", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("provides { match, location, history } props", () => {
    const PropsChecker = withRouter(props => {
      expect(typeof props.match).toBe("object");
      expect(typeof props.location).toBe("object");
      expect(typeof props.history).toBe("object");
      return null;
    });

    ReactDOM.render(
      <MemoryRouter initialEntries={["/bubblegum"]}>
        <Route path="/bubblegum" render={() => <PropsChecker />} />
      </MemoryRouter>,
      node
    );
  });

  it("provides the parent match as a prop to the wrapped component", () => {
    let parentMatch;
    const PropsChecker = withRouter(props => {
      expect(props.match).toEqual(parentMatch);
      return null;
    });

    ReactDOM.render(
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
  });

  it("works when parent match is null", () => {
    let injectedProps;
    let parentMatch;

    const PropChecker = props => {
      injectedProps = props;
      return null;
    };

    const WrappedPropChecker = withRouter(PropChecker);

    const node = document.createElement("div");
    ReactDOM.render(
      <MemoryRouter initialEntries={["/somepath"]}>
        <Route
          path="/no-match"
          children={({ match }) => {
            parentMatch = match;
            return <WrappedPropChecker />;
          }}
        />
      </MemoryRouter>,
      node
    );

    expect(parentMatch).toBe(null);
    expect(injectedProps.match).toBe(null);
  });

  describe("inside a <StaticRouter>", () => {
    it("provides the staticContext prop", () => {
      const PropsChecker = withRouter(props => {
        expect(typeof props.staticContext).toBe("object");
        expect(props.staticContext).toBe(context);
        return null;
      });

      const context = {};

      ReactDOM.render(
        <StaticRouter context={context}>
          <Route component={PropsChecker} />
        </StaticRouter>,
        node
      );
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
    ReactDOM.render(
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
