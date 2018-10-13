import React from "react";
import ReactDOM from "react-dom";

import { MemoryRouter, NavLink, withRouter } from "react-router-dom";

import renderStrict from "./utils/renderStrict";

describe("A <NavLink>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("when active", () => {
    it("applies its default activeClassName", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pizza">Pizza!</NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).toContain("active");
    });

    it("applies a custom activeClassName instead of the default", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pizza" activeClassName="selected">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("active");
      expect(a.className).toContain("selected");
    });

    it("applies its activeStyle", () => {
      const defaultStyle = { color: "black" };
      const activeStyle = { color: "red" };

      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pizza" style={defaultStyle} activeStyle={activeStyle}>
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.style.color).toBe(activeStyle.color);
    });

    it("applies the default aria-current", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pizza">Pizza!</NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.getAttribute("aria-current")).toEqual("page");
    });

    it("applies a custom aria-current instead of the default", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pizza" aria-current="true">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.getAttribute("aria-current")).toEqual("true");
    });

    it("handles locations without a pathname", () => {
      expect(() => {
        renderStrict(
          <MemoryRouter initialEntries={["/pizza"]}>
            <NavLink to={{ search: "foo=bar" }}>Pizza!</NavLink>
          </MemoryRouter>,
          node
        );
      }).not.toThrow();
    });

    it("it automatically escapes special characters in the path", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza (1)"]}>
          <NavLink to="/pizza (1)">Pizza!</NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).toContain("active");
      expect(a.getAttribute("href")).toEqual("/pizza (1)");
    });

    it("renders child components that use withRouter", () => {
      class WrappedComponent extends React.Component {
        render() {
          return null;
        }
      }

      const Component = withRouter(WrappedComponent);

      let ref;
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pizza">
            <Component wrappedComponentRef={r => (ref = r)} />
          </NavLink>
        </MemoryRouter>,
        node
      );

      expect(ref instanceof WrappedComponent).toBe(true);
    });
  });

  describe("when inactive", () => {
    it("does not apply its default activeClassName", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/salad">Salad?</NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("active");
    });

    it("does not apply its activeClassName", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/salad" activeClassName="selected">
            Salad?
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("active");
      expect(a.className).not.toContain("selected");
    });

    it("does not apply its activeStyle", () => {
      const defaultStyle = { color: "black" };
      const activeStyle = { color: "red" };

      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/salad" style={defaultStyle} activeStyle={activeStyle}>
            Salad?
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.style.color).toBe(defaultStyle.color);
    });

    it("does not apply an aria-current value if no override value is given", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/salad" activeClassName="selected" aria-current="page">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.getAttribute("aria-current")).toBeNull();
    });

    it("does not apply an aria-current value if an override value is given", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/salad" activeClassName="selected">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.getAttribute("aria-current")).toBeNull();
    });

    it("renders child components that use withRouter", () => {
      class WrappedComponent extends React.Component {
        render() {
          return null;
        }
      }

      const Component = withRouter(WrappedComponent);

      let ref;
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink exact to="/salad">
            <Component wrappedComponentRef={r => (ref = r)} />
          </NavLink>
        </MemoryRouter>,
        node
      );

      expect(ref instanceof WrappedComponent).toBe(true);
    });
  });

  describe("isActive", () => {
    it("applies active default props when isActive returns true", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pizza" isActive={() => true}>
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).toContain("active");
    });

    it("applies activeClassName when isActive returns true", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pizza" activeClassName="selected" isActive={() => true}>
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("active");
      expect(a.className).toContain("selected");
    });

    it("does not apply default activeClassName when isActive returns false", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pizza" isActive={() => false}>
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("active");
    });

    it("does not apply custom activeClassName when isActive returns false", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink
            to="/pizza"
            activeClassName="selected"
            isActive={() => false}
          >
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("active");
      expect(a.className).not.toContain("selected");
    });
  });

  it("does not do exact matching by default", () => {
    renderStrict(
      <MemoryRouter initialEntries={["/pizza/anchovies"]}>
        <NavLink to="/pizza" activeClassName="active">
          Pizza!
        </NavLink>
      </MemoryRouter>,
      node
    );

    const a = node.querySelector("a");

    expect(a.className).toContain("active");
  });

  describe("with `exact=true`", () => {
    it("applies default activeClassName for exact matches", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink exact to="/pizza">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).toContain("active");
    });

    it("does not apply default activeClassName for partial matches", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza/anchovies"]}>
          <NavLink exact to="/pizza">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("active");
    });

    it("applies custom activeClassName for exact matches", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink exact to="/pizza" activeClassName="selected">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).toContain("selected");
    });

    it("applies custom activeClassName for partial matches", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza/anchovies"]}>
          <NavLink exact to="/pizza" activeClassName="selected">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("selected");
    });
  });

  it("does not do strict matching by default", () => {
    renderStrict(
      <MemoryRouter initialEntries={["/pizza"]}>
        <NavLink to="/pizza/">Pizza!</NavLink>
      </MemoryRouter>,
      node
    );

    const a = node.querySelector("a");

    expect(a.className).toContain("active");
  });

  describe("with `strict=true`", () => {
    it("applies default activeClassName for strict matches", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza/"]}>
          <NavLink strict to="/pizza/">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).toContain("active");
    });

    it("does not apply default activeClassName for non-strict matches", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink strict to="/pizza/">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("active");
    });

    it("applies custom activeClassName for strict matches", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza/"]}>
          <NavLink strict to="/pizza/" activeClassName="selected">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).toContain("selected");
    });

    it("does not apply custom activeClassName for non-strict matches", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink strict to="/pizza/" activeClassName="selected">
            Pizza!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("selected");
    });
  });

  describe("the `location` prop", () => {
    it("overrides the current location", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza"]}>
          <NavLink to="/pasta" location={{ pathname: "/pasta" }}>
            Pasta!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).toContain("active");
    });

    it("is not overwritten by the current location", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pasta"]}>
          <NavLink to="/pasta" location={{ pathname: "/pizza" }}>
            Pasta!
          </NavLink>
        </MemoryRouter>,
        node
      );

      const a = node.querySelector("a");

      expect(a.className).not.toContain("active");
    });
  });
});
