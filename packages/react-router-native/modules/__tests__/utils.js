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

export function mockPromiseThatResolvesImmediatelyWith(value) {
  return {
    then(callback) {
      callback(value);
    }
  };
}
