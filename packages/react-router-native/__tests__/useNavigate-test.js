import React from "react";
import ShallowRenderer from "react-test-renderer/shallow";
import { TouchableHighlight } from "react-native";
import { useNavigate } from "../hooks.js";

function CustomLink({ to, replace = false, ...rest }) {
  let navigate = useNavigate();
  function handlePress() {
    navigate(to, { replace });
  }
  return <TouchableHighlight {...rest} onPress={handlePress} />;
}

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

describe.skip("useNavigate", () => {
  it("navigates using push when pressed", () => {
    const renderer = new ShallowRenderer();
    const context = createContext();
    renderer.render(<CustomLink to="/push" />, context);

    const output = renderer.getRenderOutput();
    const event = new EventStub();
    output.props.onPress(event);

    const { push } = context.router.history;
    expect(push.mock.calls.length).toBe(1);
    expect(push.mock.calls[0][0]).toBe("/push");
  });

  it("navigates using push when pressed when replace is false", () => {
    const renderer = new ShallowRenderer();
    const context = createContext();
    renderer.render(<CustomLink to="/push" replace={false} />, context);

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
    renderer.render(<CustomLink to="/replace" replace={true} />, context);

    const output = renderer.getRenderOutput();
    const event = new EventStub();
    output.props.onPress(event);

    const { replace } = context.router.history;
    expect(replace.mock.calls.length).toBe(1);
    expect(replace.mock.calls[0][0]).toBe("/replace");
  });
});
