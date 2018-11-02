import "jest";
import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory } from "history";
import { MemoryRouter, Router, Switch, Route, Focus } from "react-router-dom";

import renderStrict from "./utils/renderStrict";

jest.useFakeTimers();

describe("<Focus>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("mounting", () => {
    it("focuses ref component when mounting", () => {
      renderStrict(
        <MemoryRouter>
          <Focus>
            {ref => (
              <div id="test" tabIndex={-1} ref={ref}>
                Testing!
              </div>
            )}
          </Focus>
        </MemoryRouter>,
        node
      );

      jest.runAllTimers();

      const ref = node.querySelector("#test");
      const focused = document.activeElement;
      expect(focused).toBe(ref);
    });

    it("warns if ref isn't attached to an element (body focused)", () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});

      renderStrict(
        <MemoryRouter>
          <Focus>{ref => null}</Focus>
        </MemoryRouter>,
        node
      );

      jest.runAllTimers();

      expect(document.activeElement).toBe(document.body);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        "There is no element to focus. Did you forget to add the ref to an element?"
      );
    });
  });

  describe("updates", () => {
    it("when the location does NOT change, the ref is not re-focused", () => {
      renderStrict(
        <MemoryRouter>
          <Focus>
            {ref => (
              <div id="test" tabIndex={-1} ref={ref}>
                <input type="text" />
              </div>
            )}
          </Focus>
        </MemoryRouter>,
        node
      );

      jest.runAllTimers();

      const wrapper = node.querySelector("#test");
      const initialFocus = document.activeElement;

      expect(initialFocus).toBe(wrapper);

      const input = node.querySelector("input");
      // steal the focus
      input.focus();
      const stolenFocus = document.activeElement;
      expect(stolenFocus).toBe(input);

      // re-render
      renderStrict(
        <MemoryRouter>
          <Focus>
            {ref => (
              <div id="test" tabIndex={-1} ref={ref}>
                <input type="text" />
              </div>
            )}
          </Focus>
        </MemoryRouter>,
        node
      );

      jest.runAllTimers();

      expect(stolenFocus).toBe(input);
    });

    describe("new location", () => {
      it("re-focuses ref when the location changes", () => {
        const history = createMemoryHistory();
        renderStrict(
          <Router history={history}>
            <Focus>
              {ref => (
                <div id="test" tabIndex={-1} ref={ref}>
                  <input type="text" />
                </div>
              )}
            </Focus>
          </Router>,
          node
        );

        jest.runAllTimers();

        const input = node.querySelector("input");
        const wrapper = input.parentElement;
        const initialFocused = document.activeElement;

        expect(wrapper).toBe(initialFocused);

        // steal the focus
        input.focus();
        const stolenFocus = document.activeElement;
        expect(input).toBe(stolenFocus);

        history.push("/somewhere-else");

        jest.runAllTimers();

        const postNavFocus = document.activeElement;

        expect(wrapper).toBe(postNavFocus);
      });

      it("focuses new ref for new locations", () => {
        const Home = React.forwardRef((_, ref) => (
          <div id="home" tabIndex={-1} ref={ref}>
            <h1>Home</h1>
          </div>
        ));
        const About = React.forwardRef((_, ref) => (
          <div id="about" tabIndex={-1} ref={ref}>
            <h1>About</h1>
          </div>
        ));

        const history = createMemoryHistory();
        renderStrict(
          <Router history={history}>
            <Focus>
              {ref => (
                <Switch>
                  <Route
                    path="/"
                    exact
                    render={match => <Home ref={ref} {...match} />}
                  />
                  <Route
                    path="/about"
                    render={match => <About ref={ref} {...match} />}
                  />
                </Switch>
              )}
            </Focus>
          </Router>,
          node
        );

        jest.runAllTimers();

        const homeDiv = node.querySelector("#home");
        expect(document.activeElement).toBe(homeDiv);

        history.push("/about");

        jest.runAllTimers();

        const aboutDiv = node.querySelector("#about");
        expect(document.activeElement).toBe(aboutDiv);
      });

      it("warns if ref isn't attached to an element (body focused)", () => {
        jest.spyOn(console, "warn").mockImplementation(() => {});

        const Home = ({ innerRef }) => (
          <div id="home" tabIndex={-1} ref={innerRef}>
            <h1>Home</h1>
          </div>
        );

        const About = () => (
          <div id="about">
            <h1>About</h1>
          </div>
        );

        const history = createMemoryHistory();
        renderStrict(
          <Router history={history}>
            <Focus>
              {ref => (
                <Switch>
                  <Route
                    path="/"
                    exact
                    render={match => <Home innerRef={ref} {...match} />}
                  />
                  <Route path="/about" render={match => <About {...match} />} />
                </Switch>
              )}
            </Focus>
          </Router>,
          node
        );

        jest.runAllTimers();

        const homeDiv = node.querySelector("#home");
        expect(document.activeElement).toBe(homeDiv);
        expect(console.warn).toHaveBeenCalledTimes(0);

        history.push("/about");

        jest.runAllTimers();

        expect(document.activeElement).toBe(document.body);
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith(
          "There is no element to focus. Did you forget to add the ref to an element?"
        );
      });
    });
  });

  describe("preserve", () => {
    describe("false (default)", () => {
      it("re-focuses for new location re-renders", () => {
        const history = createMemoryHistory();
        renderStrict(
          <Router history={history}>
            <Focus>
              {ref => (
                <div id="test" tabIndex={-1} ref={ref}>
                  <input type="text" />
                </div>
              )}
            </Focus>
          </Router>,
          node
        );

        jest.runAllTimers();

        const input = node.querySelector("input");
        const wrapper = input.parentElement;
        const initialFocused = document.activeElement;

        expect(wrapper).toBe(initialFocused);

        // steal the focus
        input.focus();
        const stolenFocus = document.activeElement;
        expect(input).toBe(stolenFocus);

        // navigate and verify wrapper is re-focused
        history.push("/somewhere-else");

        jest.runAllTimers();

        const postNavFocus = document.activeElement;

        expect(wrapper).toBe(postNavFocus);
      });
    });

    describe("true", () => {
      it("does not focus ref if something is already ", () => {
        const history = createMemoryHistory();
        renderStrict(
          <Router history={history}>
            <Focus preserve={true}>
              {ref => (
                <div id="test" tabIndex={-1} ref={ref}>
                  <input type="text" />
                </div>
              )}
            </Focus>
          </Router>,
          node
        );

        jest.runAllTimers();

        const input = node.querySelector("input");
        const wrapper = input.parentElement;
        const initialFocused = document.activeElement;

        expect(wrapper).toBe(initialFocused);

        // steal the focus
        input.focus();
        const stolenFocus = document.activeElement;
        expect(input).toBe(stolenFocus);

        // navigate and verify wrapper is NOT re-focused
        history.push("/somewhere-else");

        jest.runAllTimers();

        const postNavFocus = document.activeElement;

        expect(postNavFocus).toBe(input);
      });
    });
  });

  describe("preventScroll", () => {
    const realFocus = HTMLElement.prototype.focus;
    let fakeFocus;

    beforeEach(() => {
      fakeFocus = HTMLElement.prototype.focus = jest.fn();
    });

    afterEach(() => {
      fakeFocus.mockReset();
      HTMLElement.prototype.focus = realFocus;
    });

    it("calls focus({ preventScroll: false }} when not provided", () => {
      renderStrict(
        <MemoryRouter>
          <Focus>
            {ref => (
              <div id="test" tabIndex={-1} ref={ref}>
                <input type="text" />
              </div>
            )}
          </Focus>
        </MemoryRouter>,
        node
      );
      jest.runAllTimers();
      expect(fakeFocus.mock.calls[0][0]).toMatchObject({
        preventScroll: false
      });
    });

    it("calls focus({ preventScroll: true }} when preventScroll = true", () => {
      renderStrict(
        <MemoryRouter>
          <Focus preventScroll={true}>
            {ref => (
              <div id="test" tabIndex={-1} ref={ref}>
                <input type="text" />
              </div>
            )}
          </Focus>
        </MemoryRouter>,
        node
      );
      jest.runAllTimers();
      expect(fakeFocus.mock.calls[0][0]).toMatchObject({ preventScroll: true });
    });

    it("calls focus({ preventScroll: false }} when preventScroll = false", () => {
      renderStrict(
        <MemoryRouter>
          <Focus preventScroll={false}>
            {ref => (
              <div id="test" tabIndex={-1} ref={ref}>
                <input type="text" />
              </div>
            )}
          </Focus>
        </MemoryRouter>,
        node
      );
      jest.runAllTimers();
      expect(fakeFocus.mock.calls[0][0]).toMatchObject({
        preventScroll: false
      });
    });
  });

  describe("tabIndex", () => {
    it("warns when ref element does not have a tabIndex attribute", () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});

      renderStrict(
        <MemoryRouter>
          <Focus>
            {ref => (
              <div id="test" ref={ref}>
                <input type="text" />
              </div>
            )}
          </Focus>
        </MemoryRouter>,
        node
      );

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'The ref must be assigned an element with the "tabIndex" attribute or be focusable by default in order to be focused. ' +
          "Otherwise, the document's <body> will be focused instead."
      );
    });

    it("does not warn when ref element does not have a tabIndex attribute, but is already focusable", () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});

      renderStrict(
        <MemoryRouter>
          <Focus>
            {ref => (
              <div id="test">
                <input type="text" ref={ref} />
              </div>
            )}
          </Focus>
        </MemoryRouter>,
        node
      );

      expect(console.warn).toHaveBeenCalledTimes(0);
    });
  });
});
