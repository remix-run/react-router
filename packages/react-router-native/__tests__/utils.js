export class MockEvent {
  constructor(type, extraProps) {
    this.type = type;
    this.defaultPrevented = false;
    Object.assign(this, extraProps);
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
}

export function press(element, extraProps) {
  if (!element.props.onPress) {
    throw new Error(`Missing onPress prop for element in press(element)`);
  }
  let event = new MockEvent('press', extraProps);
  element.props.onPress(event);
  return event;
}

export function mockPromiseThatResolvesImmediatelyWith(value) {
  return {
    then(callback) {
      callback(value);
    }
  };
}
