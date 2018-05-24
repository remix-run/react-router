import React from "react";
import ReactDOM from "react-dom";
import ReactDOMServer from "react-dom/server";
import StaticRouter from "react-router/StaticRouter";
import MemoryRouter from "react-router/MemoryRouter";
import Router from "react-router/Router";
import renderRoutes from "../renderRoutes";
import createHistory from "history/createMemoryHistory";

let renderedRoutes;
let renderedExtraProps;

const RenderRoutes = ({ route, route: { routes }, ...extraProps }) => (
  renderedRoutes.push(route),
  renderedExtraProps.push(extraProps),
  renderRoutes(routes)
);

const RenderChild = ({ renderChild, route, ...extraProps }) => (
  renderedRoutes.push(route),
  renderedExtraProps.push(extraProps),
  renderChild(extraProps)
);

buildTests("renderRoutes", RenderRoutes);
buildTests("renderChild", RenderChild);

function buildTests(title, RenderRoutes) {
  describe(title, () => {
    beforeEach(() => {
      renderedRoutes = [];
      renderedExtraProps = [];
    });

    it("renders pathless routes", () => {
      const routeToMatch = {
        component: RenderRoutes
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
        component: RenderRoutes
      };
      const routes = [routeToMatch];
      const extraProps = { anExtraProp: "anExtraPropValue" };

      ReactDOMServer.renderToString(
        <StaticRouter location="/path" context={{}}>
          {renderRoutes(routes, { extraProps })}
        </StaticRouter>
      );
      expect(renderedExtraProps.length).toEqual(1);
      expect(renderedExtraProps[0].anExtraProp).toEqual("anExtraPropValue");
    });

    it("passes extraProps to the component rendered by a matched route", () => {
      const routeToMatch = {
        component: RenderRoutes,
        path: "/"
      };
      const routes = [
        routeToMatch,
        {
          component: RenderRoutes
        }
      ];
      const extraProps = { anExtraProp: "anExtraPropValue" };

      ReactDOMServer.renderToString(
        <StaticRouter location="/" context={{}}>
          {renderRoutes(routes, { extraProps })}
        </StaticRouter>
      );
      expect(renderedExtraProps.length).toEqual(1);
      expect(renderedExtraProps[0].anExtraProp).toEqual("anExtraPropValue");
    });

    describe("Switch usage", () => {
      it("renders the first matched route", () => {
        const routeToMatch = {
          component: RenderRoutes,
          path: "/"
        };
        const routes = [
          routeToMatch,
          {
            component: RenderRoutes
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
          component: RenderRoutes,
          path: "/"
        };
        const routeToMatch = {
          component: RenderRoutes,
          path: "/",
          routes: [
            childRouteToMatch,
            {
              component: RenderRoutes
            }
          ]
        };
        const routes = [
          routeToMatch,
          {
            component: RenderRoutes
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
          component: RenderRoutes,
          path: "/one"
        };

        const routes = [
          {
            path: "/",
            component: App,
            routes: [
              {
                path: "/one",
                component: RenderRoutes
              }
            ]
          }
        ];

        ReactDOMServer.renderToString(
          <StaticRouter location="/two" context={{}}>
            {renderRoutes(routes, {
              extraProps: {},
              switchProps: { location: { pathname: "/one" } }
            })}
          </StaticRouter>
        );

        expect(renderedRoutes.length).toEqual(1);
        expect(renderedRoutes[0]).toEqual(routeToMatch);
      });
    });

    describe("routes with redirect", () => {
      it("redirects for a matching path", () => {
        const node = document.createElement("div");

        let params = void 0;

        const Target = props => {
          params = props.match.params;
          return false;
        };

        const routes = [
          {
            path: "/users/:username/messages/:messageId",
            redirect: "/:username/messages/:messageId"
          },
          {
            path: "/:username/messages/:messageId",
            component: Target
          }
        ];

        ReactDOM.render(
          <MemoryRouter initialEntries={["/users/mjackson/messages/123"]}>
            {renderRoutes(routes)}
          </MemoryRouter>,
          node
        );

        expect(params).toMatchObject({
          username: "mjackson",
          messageId: "123"
        });
      });

      it("does not redirect for a non matching path", () => {
        const node = document.createElement("div");

        let params = void 0;

        const Target = props => {
          params = props.match.params;
          return false;
        };

        const routes = [
          {
            path: "/users/:username/details/:messageId",
            redirect: "/users/:username/messages/:messageId"
          },
          {
            path: "/users/:username/messages/:messageId",
            component: Target
          }
        ];

        ReactDOM.render(
          <MemoryRouter initialEntries={["/users/mjackson/messages/123"]}>
            {renderRoutes(routes)}
          </MemoryRouter>,
          node
        );

        expect(params).toMatchObject({
          username: "mjackson",
          messageId: "123"
        });
      });
    });

    describe("routes with props", () => {
      it("passes the route props to the component", () => {
        const routeToMatch = {
          component: RenderRoutes,
          path: "/",
          props: {
            anExtraProp: "anExtraPropValue"
          }
        };
        const routes = [
          routeToMatch,
          {
            component: RenderRoutes
          }
        ];

        ReactDOMServer.renderToString(
          <StaticRouter location="/" context={{}}>
            {renderRoutes(routes)}
          </StaticRouter>
        );
        expect(renderedExtraProps.length).toEqual(1);
        expect(renderedExtraProps[0].anExtraProp).toEqual("anExtraPropValue");
      });

      it("passes the route props to the component before the extra props", () => {
        const routeToMatch = {
          component: RenderRoutes,
          path: "/",
          props: {
            anExtraProp: "anExtraPropValue2"
          }
        };
        const routes = [
          routeToMatch,
          {
            component: RenderRoutes
          }
        ];

        ReactDOMServer.renderToString(
          <StaticRouter location="/" context={{}}>
            {renderRoutes(routes, {
              extraProps: { anExtraProp: "anExtraPropValue" }
            })}
          </StaticRouter>
        );
        expect(renderedExtraProps.length).toEqual(1);
        expect(renderedExtraProps[0].anExtraProp).toEqual("anExtraPropValue");
      });
    });

    describe("routes with forced props", () => {
      it("passes the forced route props to the component", () => {
        const routeToMatch = {
          component: RenderRoutes,
          path: "/",
          forcedProps: {
            anExtraProp: "anExtraPropValue"
          }
        };
        const routes = [
          routeToMatch,
          {
            component: RenderRoutes
          }
        ];

        ReactDOMServer.renderToString(
          <StaticRouter location="/" context={{}}>
            {renderRoutes(routes)}
          </StaticRouter>
        );
        expect(renderedExtraProps.length).toEqual(1);
        expect(renderedExtraProps[0].anExtraProp).toEqual("anExtraPropValue");
      });

      it("passes the route props to the component after the extra props", () => {
        const routeToMatch = {
          component: RenderRoutes,
          path: "/",
          forcedProps: {
            anExtraProp: "anExtraPropValue"
          }
        };
        const routes = [
          routeToMatch,
          {
            component: RenderRoutes
          }
        ];

        ReactDOMServer.renderToString(
          <StaticRouter location="/" context={{}}>
            {renderRoutes(routes, {
              extraProps: { anExtraProp: "anExtraPropValue2" }
            })}
          </StaticRouter>
        );
        expect(renderedExtraProps.length).toEqual(1);
        expect(renderedExtraProps[0].anExtraProp).toEqual("anExtraPropValue");
      });
    });

    it("ignores the route component when it redirects for a matching path", () => {
      const node = document.createElement("div");

      let params = void 0;
      let redirectRendered = false;

      const Target = props => {
        params = props.match.params;
        return false;
      };

      const RedirectComponent = () => {
        redirectRendered = true;
        return false;
      };

      const routes = [
        {
          path: "/users/:username/messages/:messageId",
          redirect: "/:username/messages/:messageId",
          component: RedirectComponent
        },
        {
          path: "/:username/messages/:messageId",
          component: Target
        }
      ];

      ReactDOM.render(
        <MemoryRouter initialEntries={["/users/mjackson/messages/123"]}>
          {renderRoutes(routes)}
        </MemoryRouter>,
        node
      );

      expect(redirectRendered).toBe(false);

      expect(params).toMatchObject({
        username: "mjackson",
        messageId: "123"
      });
    });

    describe("routes with exact", () => {
      it("renders the exact route", () => {
        const routeToMatch = {
          component: RenderRoutes,
          path: "/path/child",
          exact: true,
          routes: [
            {
              component: RenderRoutes
            }
          ]
        };
        const routes = [
          {
            component: RenderRoutes,
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
        expect(renderedRoutes[1]).toEqual({ component: RenderRoutes });
      });

      it("skips exact route and does not render it and any of its child routes", () => {
        const routes = [
          {
            component: RenderRoutes,
            path: "/path",
            exact: true,
            routes: [
              {
                component: RenderRoutes
              },
              {
                component: RenderRoutes
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
            component: RenderRoutes,
            path: "/path",
            exact: true,
            routes: [
              {
                // should skip
                component: RenderRoutes,
                path: "/path/child",
                exact: true
              },
              {
                // should render
                component: RenderRoutes
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
          component: RenderRoutes,
          path: "/path/",
          exact: true,
          strict: true
        };
        const routes = [
          {
            // should skip
            component: RenderRoutes,
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
            component: RenderRoutes,
            path: "/path/",
            exact: true,
            strict: true,
            routes: [
              {
                component: RenderRoutes
              },
              {
                component: RenderRoutes
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
            component: RenderRoutes,
            path: "/path",
            exact: true,
            strict: true
          },
          {
            // should render
            component: RenderRoutes,
            path: "/path/",
            exact: true,
            strict: true,
            routes: [
              {
                // should skip
                component: RenderRoutes,
                exact: true,
                strict: true,
                path: "/path"
              },
              {
                // should render
                component: RenderRoutes,
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
  });
}
