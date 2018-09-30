import React from "react";
import ReactDOM from "react-dom";
import ReactDOMServer from "react-dom/server";
import { Router, StaticRouter } from "react-router";
import createHistory from "history/createMemoryHistory";

import renderRoutes from "../renderRoutes";

describe("renderRoutes", () => {
  let renderedRoutes;
  let renderedExtraProps;
  const Comp = ({ route, route: { routes }, ...extraProps }) => (
    renderedRoutes.push(route),
    renderedExtraProps.push(extraProps),
    renderRoutes(routes)
  );

  beforeEach(() => {
    renderedRoutes = [];
    renderedExtraProps = [];
  });

  it("renders pathless routes", () => {
    const routeToMatch = {
      component: Comp
    };
    const routes = [routeToMatch];

    ReactDOMServer.renderToString(
      <StaticRouter location="/path" context={{}}>
        {renderRoutes(routes)}
      </StaticRouter>
    );
    expect(renderedRoutes.length).toEqual(1);
    expect(renderedRoutes[0]).toEqual(routeToMatch);
  });

  it("passes extraProps to the component rendered by a pathless route", () => {
    const routeToMatch = {
      component: Comp
    };
    const routes = [routeToMatch];
    const extraProps = { anExtraProp: "anExtraPropValue" };

    ReactDOMServer.renderToString(
      <StaticRouter location="/path" context={{}}>
        {renderRoutes(routes, extraProps)}
      </StaticRouter>
    );
    expect(renderedExtraProps.length).toEqual(1);
    expect(renderedExtraProps[0].anExtraProp).toEqual("anExtraPropValue");
  });

  it("passes extraProps to the component rendered by a matched route", () => {
    const routeToMatch = {
      component: Comp,
      path: "/"
    };
    const routes = [
      routeToMatch,
      {
        component: Comp
      }
    ];
    const extraProps = { anExtraProp: "anExtraPropValue" };

    ReactDOMServer.renderToString(
      <StaticRouter location="/" context={{}}>
        {renderRoutes(routes, extraProps)}
      </StaticRouter>
    );
    expect(renderedExtraProps.length).toEqual(1);
    expect(renderedExtraProps[0].anExtraProp).toEqual("anExtraPropValue");
  });

  describe("Switch usage", () => {
    it("renders the first matched route", () => {
      const routeToMatch = {
        component: Comp,
        path: "/"
      };
      const routes = [
        routeToMatch,
        {
          component: Comp
        }
      ];

      ReactDOMServer.renderToString(
        <StaticRouter location="/" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      expect(renderedRoutes.length).toEqual(1);
      expect(renderedRoutes[0]).toEqual(routeToMatch);
    });

    it("renders the first matched route in nested routes", () => {
      const childRouteToMatch = {
        component: Comp,
        path: "/"
      };
      const routeToMatch = {
        component: Comp,
        path: "/",
        routes: [
          childRouteToMatch,
          {
            component: Comp
          }
        ]
      };
      const routes = [
        routeToMatch,
        {
          component: Comp
        }
      ];

      ReactDOMServer.renderToString(
        <StaticRouter location="/" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      expect(renderedRoutes.length).toEqual(2);
      expect(renderedRoutes[0]).toEqual(routeToMatch);
      expect(renderedRoutes[1]).toEqual(childRouteToMatch);
    });

    it("does not remount a <Route>", () => {
      const node = document.createElement("div");

      let mountCount = 0;

      const App = ({ route: { routes } }) => renderRoutes(routes);

      class Comp extends React.Component {
        componentDidMount() {
          mountCount++;
        }

        render() {
          return <div />;
        }
      }

      const routes = [
        {
          path: "/",
          component: App,
          routes: [
            {
              path: "/one",
              component: Comp,
              key: "comp"
            },
            {
              path: "/two",
              component: Comp,
              key: "comp"
            },
            {
              path: "/three",
              component: Comp
            }
          ]
        }
      ];

      const history = createHistory({
        initialEntries: ["/one"]
      });

      ReactDOM.render(
        <Router history={history}>{renderRoutes(routes)}</Router>,
        node
      );

      expect(mountCount).toBe(1);

      history.push("/one");
      expect(mountCount).toBe(1);

      history.push("/two");
      expect(mountCount).toBe(1);

      history.push("/three");
      expect(mountCount).toBe(2);
    });

    it("passes props to Switch", () => {
      const App = ({ route: { routes } }) => renderRoutes(routes);

      const routeToMatch = {
        component: Comp,
        path: "/one"
      };

      const routes = [
        {
          path: "/",
          component: App,
          routes: [
            {
              path: "/one",
              component: Comp
            }
          ]
        }
      ];

      ReactDOMServer.renderToString(
        <StaticRouter location="/two" context={{}}>
          {renderRoutes(routes, {}, { location: { pathname: "/one" } })}
        </StaticRouter>
      );

      expect(renderedRoutes.length).toEqual(1);
      expect(renderedRoutes[0]).toEqual(routeToMatch);
    });
  });

  describe("routes with exact", () => {
    it("renders the exact route", () => {
      const routeToMatch = {
        component: Comp,
        path: "/path/child",
        exact: true,
        routes: [
          {
            component: Comp
          }
        ]
      };
      const routes = [
        {
          component: Comp,
          path: "/path",
          exact: true
        },
        routeToMatch
      ];

      ReactDOMServer.renderToString(
        <StaticRouter location="/path/child" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      expect(renderedRoutes.length).toEqual(2);
      expect(renderedRoutes[0]).toEqual(routeToMatch);
      expect(renderedRoutes[1]).toEqual({ component: Comp });
    });

    it("skips exact route and does not render it and any of its child routes", () => {
      const routes = [
        {
          component: Comp,
          path: "/path",
          exact: true,
          routes: [
            {
              component: Comp
            },
            {
              component: Comp
            }
          ]
        }
      ];

      ReactDOMServer.renderToString(
        <StaticRouter location="/path/child" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      ReactDOMServer.renderToString(
        <StaticRouter location="/" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      expect(renderedRoutes.length).toEqual(0);
    });

    it("renders the matched exact route but not its child routes if they do not match", () => {
      const routes = [
        {
          // should render
          component: Comp,
          path: "/path",
          exact: true,
          routes: [
            {
              // should skip
              component: Comp,
              path: "/path/child",
              exact: true
            },
            {
              // should render
              component: Comp
            }
          ]
        }
      ];

      ReactDOMServer.renderToString(
        <StaticRouter location="/path/child/grandchild" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      ReactDOMServer.renderToString(
        <StaticRouter location="/path" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      expect(renderedRoutes.length).toEqual(2);
      expect(renderedRoutes[0]).toEqual(routes[0]);
      expect(renderedRoutes[1]).toEqual(routes[0].routes[1]);
    });
  });

  describe("routes with exact + strict", () => {
    it("renders the exact strict route", () => {
      const routeToMatch = {
        component: Comp,
        path: "/path/",
        exact: true,
        strict: true
      };
      const routes = [
        {
          // should skip
          component: Comp,
          path: "/path",
          exact: true,
          strict: true
          // should render
        },
        routeToMatch
      ];

      ReactDOMServer.renderToString(
        <StaticRouter location="/path/" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      expect(renderedRoutes.length).toEqual(1);
      expect(renderedRoutes[0]).toEqual(routeToMatch);
    });

    it("skips exact strict route and does not render it and any of its child routes", () => {
      const routes = [
        {
          component: Comp,
          path: "/path/",
          exact: true,
          strict: true,
          routes: [
            {
              component: Comp
            },
            {
              component: Comp
            }
          ]
        }
      ];

      ReactDOMServer.renderToString(
        <StaticRouter location="/path/child" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      ReactDOMServer.renderToString(
        <StaticRouter location="/" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      ReactDOMServer.renderToString(
        <StaticRouter location="/path" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      expect(renderedRoutes.length).toEqual(0);
    });

    it("renders the matched exact strict route but not its child routes if they do not match", () => {
      const routes = [
        {
          // should skip
          component: Comp,
          path: "/path",
          exact: true,
          strict: true
        },
        {
          // should render
          component: Comp,
          path: "/path/",
          exact: true,
          strict: true,
          routes: [
            {
              // should skip
              component: Comp,
              exact: true,
              strict: true,
              path: "/path"
            },
            {
              // should render
              component: Comp,
              exact: true,
              strict: true,
              path: "/path/"
            }
          ]
        }
      ];

      ReactDOMServer.renderToString(
        <StaticRouter location="/path/child/grandchild" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      ReactDOMServer.renderToString(
        <StaticRouter location="/path/" context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      );
      expect(renderedRoutes.length).toEqual(2);
      expect(renderedRoutes[0]).toEqual(routes[1]);
      expect(renderedRoutes[1]).toEqual(routes[1].routes[1]);
    });
  });

  it("allows rendering a component using a function with render property", () => {
    const routes = [
      {
        path: "/path",
        render: props => <Comp {...props} />
      }
    ];

    ReactDOMServer.renderToString(
      <StaticRouter location="/path" context={{}}>
        {renderRoutes(routes)}
      </StaticRouter>
    );
    expect(renderedRoutes.length).toEqual(1);
    expect(renderedRoutes[0]).toEqual(routes[0]);
  });
});
