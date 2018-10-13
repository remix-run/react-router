import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";

import Link from "../Link";

function createContext() {
  return {
    router: {
      history: {
        push: jest.fn(),
        replace: jest.fn()
      }
    }
  };
}

class EventStub {
  preventDefault() {
    this.defaultPrevented = true;
  }
}

describe.skip("<Link />", () => {
  it("navigates using push when pressed", () => {
    const renderer = new ShallowRenderer();
    const context = createContext();
    renderer.render(<Link to="/push" />, context);

    const output = renderer.getRenderOutput();
    const event = new EventStub();
    output.props.onPress(event);

    const { push } = context.router.history;
    expect(push.mock.calls.length).toBe(1);
    expect(push.mock.calls[0][0]).toBe("/push");
  });

  it("navigates using replace when replace is true", () => {
    const renderer = new ShallowRenderer();
    const context = createContext();
    renderer.render(<Link to="/replace" replace={true} />, context);

    const output = renderer.getRenderOutput();
    const event = new EventStub();
    output.props.onPress(event);

    const { replace } = context.router.history;
    expect(replace.mock.calls.length).toBe(1);
    expect(replace.mock.calls[0][0]).toBe("/replace");
  });

  it("calls onPress when pressed", () => {
    const renderer = new ShallowRenderer();
    const onPress = jest.fn();
    const context = createContext();
    renderer.render(<Link onPress={onPress} to="/" />, context);

    const output = renderer.getRenderOutput();
    const event = new EventStub();
    output.props.onPress(event);

    expect(onPress.mock.calls.length).toBe(1);
    expect(onPress.mock.calls[0][0]).toBe(event);
  });

  it("does not navigate when the press event is cancelled", () => {
    const renderer = new ShallowRenderer();
    const onPress = event => event.preventDefault();
    const context = createContext();
    renderer.render(<Link onPress={onPress} to="/" />, context);

    const output = renderer.getRenderOutput();
    const event = new EventStub();
    output.props.onPress(event);

    const { push, replace } = context.router.history;
    expect(push.mock.calls.length).toBe(0);
    expect(replace.mock.calls.length).toBe(0);
  });
});
