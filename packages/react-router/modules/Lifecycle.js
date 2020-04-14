import React from "react";

class Lifecycle extends React.PureComponent {
  componentDidMount() {
    if (this.props.onMount) this.props.onMount.call(this, this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.onUpdate) this.props.onUpdate.call(this, this, prevProps);
  }

  componentWillUnmount() {
    if (this.props.onUnmount) this.props.onUnmount.call(this, this);
  }

  render() {
    return null;
  }
}

export default Lifecycle;
