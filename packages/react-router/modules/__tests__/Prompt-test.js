import React from "react";
import ReactDOM from "react-dom";
import createMemoryHistory from "history/createMemoryHistory";

import MemoryRouter from "../MemoryRouter";
import Prompt from "../Prompt";
import Router from "../Router";

describe("A <Prompt>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("with no message", () => {
    it("logs a warning to the console", () => {
      spyOn(console, "error");

      ReactDOM.render(
        <MemoryRouter>
          <Prompt />
        </MemoryRouter>,
        node
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          "The prop `message` is marked as required in `Prompt`"
        )
      );
    });
  });

  it("calls getUserConfirmation with the prompt message", () => {
    const getUserConfirmation = jest.fn((message, callback) => {
      callback(false);
    });

    const history = createMemoryHistory({
      getUserConfirmation: getUserConfirmation
    });

    ReactDOM.render(
      <Router history={history}>
        <Prompt message="Are you sure?" />
      </Router>,
      node
    );

    history.push("/somewhere");

    expect(getUserConfirmation).toHaveBeenCalledWith(
      expect.stringMatching("Are you sure?"),
      expect.any(Function)
    );
  });

  describe("with when=false", () => {
    it("does not call getUserConfirmation", () => {
      const getUserConfirmation = jest.fn((message, callback) => {
        callback(false);
      });

      const history = createMemoryHistory({
        getUserConfirmation: getUserConfirmation
      });

      ReactDOM.render(
        <Router history={history}>
          <Prompt message="Are you sure?" when={false} />
        </Router>,
        node
      );

      history.push("/somewhere");

      expect(getUserConfirmation).not.toHaveBeenCalled();
    });
  });
});
