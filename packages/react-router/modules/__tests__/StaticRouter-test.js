import React from "react";
import ReactDOM from "react-dom";
import ReactDOMServer from "react-dom/server";
import PropTypes from "prop-types";

import {
  Route,
  Prompt,
  Redirect,
  StaticRouter,
  __RouterContext as RouterContext
} from "react-router";

import renderStrict from "./utils/renderStrict";

describe("A <StaticRouter>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with a history prop", () => {
    it("logs a warning", () => {
      spyOn(console, "error");

      const history = {};
      renderStrict(<StaticRouter history={history} />, node);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("<StaticRouter> ignores the history prop")
      );
    });
  });

  it("reports redirects on the context object", () => {
    const context = {};

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context}>
        <Redirect to="/somewhere-else" />
      </StaticRouter>
    );

    expect(context.action).toBe("REPLACE");
    expect(context.url).toBe("/somewhere-else");
  });

  it("reports push redirects on the context object", () => {
    const context = {};

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context}>
        <Redirect to="/somewhere-else" push />
      </StaticRouter>
    );

    expect(context.action).toBe("PUSH");
    expect(context.url).toBe("/somewhere-else");
  });

  describe("with a string location prop", () => {
    it("parses the location into an object", () => {
      let location;
      function LocationChecker(props) {
        location = props.location;
        return null;
      }

      ReactDOMServer.renderToStaticMarkup(
        <StaticRouter location="/the/path?the=query#the-hash">
          <Route component={LocationChecker} />
        </StaticRouter>
      );

      expect(location).toMatchObject({
        pathname: "/the/path",
        search: "?the=query",
        hash: "#the-hash"
      });
    });

    describe("with a URL-encoded pathname", () => {
      it("decodes the pathname", () => {
        let props;
        function PropsChecker(p) {
          props = p;
          return null;
        }

        ReactDOMServer.renderToStaticMarkup(
          <StaticRouter location="/est%C3%A1tico">
            <Route path="/:type" component={PropsChecker} />
          </StaticRouter>
        );

        expect(props.location.pathname).toEqual("/estático");
        expect(props.match.params.type).toBe("estático");
      });
    });
  });

  describe("with an object location prop", () => {
    it("adds missing properties", () => {
      let location;
      function LocationChecker(props) {
        location = props.location;
        return null;
      }

      ReactDOMServer.renderToStaticMarkup(
        <StaticRouter location={{ pathname: "/the/path" }}>
          <Route component={LocationChecker} />
        </StaticRouter>
      );

      expect(location).toMatchObject({
        pathname: "/the/path",
        search: "",
        hash: ""
      });
    });

    describe("with a URL-encoded pathname", () => {
      it("decodes the pathname", () => {
        let props;
        function PropsChecker(p) {
          props = p;
          return null;
        }

        ReactDOMServer.renderToStaticMarkup(
          <StaticRouter location={{ pathname: "/est%C3%A1tico" }}>
            <Route path="/:type" component={PropsChecker} />
          </StaticRouter>
        );

        expect(props.location.pathname).toEqual("/estático");
        expect(props.match.params.type).toBe("estático");
      });
    });
  });

  it("knows how to serialize location objects", () => {
    const context = {};

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context}>
        <Redirect to={{ pathname: "/somewhere-else" }} />
      </StaticRouter>
    );

    expect(context.action).toBe("REPLACE");
    expect(context.location.pathname).toBe("/somewhere-else");
    expect(context.location.search).toBe("");
    expect(context.location.hash).toBe("");
    expect(context.url).toBe("/somewhere-else");
  });

  describe("with a basename", () => {
    it("strips the basename from location pathnames", () => {
      let location;
      function LocationChecker(props) {
        location = props.location;
        return null;
      }

      const context = {};

      ReactDOMServer.renderToStaticMarkup(
        <StaticRouter
          context={context}
          basename="/the-base"
          location="/the-base/path"
        >
          <Route component={LocationChecker} />
        </StaticRouter>
      );

      expect(location.pathname).toEqual("/path");
    });

    it("adds the basename to redirect URLs", () => {
      const context = {};

      ReactDOMServer.renderToStaticMarkup(
        <StaticRouter context={context} basename="/the-base">
          <Redirect to="/somewhere-else" />
        </StaticRouter>
      );

      expect(context.action).toBe("REPLACE");
      expect(context.url).toBe("/the-base/somewhere-else");
    });

    it("adds the basename to push redirect URLs", () => {
      const context = {};

      ReactDOMServer.renderToStaticMarkup(
        <StaticRouter context={context} basename="/the-base">
          <Redirect to="/somewhere-else" push />
        </StaticRouter>
      );

      expect(context.action).toBe("PUSH");
      expect(context.url).toBe("/the-base/somewhere-else");
    });
  });

  describe("with no basename", () => {
    it("createHref does not append extra leading slash", () => {
      const pathname = "/test-path-please-ignore";

      function HrefChecker({ to, children }) {
        return (
          <Route
            children={({ history: { createHref } }) => (
              <a href={createHref(to)}>{children}</a>
            )}
          />
        );
      }

      renderStrict(
        <StaticRouter>
          <HrefChecker to={pathname} />
        </StaticRouter>,
        node
      );

      const a = node.getElementsByTagName("a")[0];

      expect(a.getAttribute("href")).toEqual(pathname);
    });
  });

  describe("render a <Prompt>", () => {
    it("does not throw", () => {
      expect(() => {
        renderStrict(
          <StaticRouter>
            <Prompt message="this is only a test" />
          </StaticRouter>,
          node
        );
      }).not.toThrow();
    });
  });
});
