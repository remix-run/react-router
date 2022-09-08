import type * as TestRenderer from "react-test-renderer";

export class MockEvent {
  type: string;
  defaultPrevented: boolean;
  [k: string]: any;

  constructor(type: string, extraProps?: any) {
    this.type = type;
    this.defaultPrevented = false;
    Object.assign(this, extraProps);
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
}

export function press(
  element: React.ReactElement | TestRenderer.ReactTestInstance,
  extraProps?: any
) {
  if (!element.props.onPress) {
    throw new Error(`Missing onPress prop for element in press(element)`);
  }
  let event = new MockEvent("press", extraProps);
  element.props.onPress(event);
  return event;
}

export function mockPromiseThatResolvesImmediatelyWith<T = void>(value?: T) {
  return {
    then(callback: (val?: T | undefined) => any) {
      callback(value);
    },
  } as Promise<T>;
}
