import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";

/**
 * The public API for prompting the user before navigating away
 * from a screen with a component.
 */
class Prompt extends React.Component {
  static propTypes = {
    when: PropTypes.bool,
    message: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired
  };

  static defaultProps = {
    when: true
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        block: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  };

  enable(message) {
    if (this.unblock) this.unblock();

    this.unblock = this.context.router.history.block(message);
  }

  disable() {
    if (this.unblock) {
      this.unblock();
      this.unblock = null;
    }
  }

  componentDidMount() {
    invariant(
      this.context.router,
      "You should not use <Prompt> outside a <Router>"
    );

    if (this.props.when) this.enable(this.props.message);
  }

  componentDidUpdate(prevProps) {
    if (this.props.when) {
      if (!prevProps.when || prevProps.message !== this.props.message)
        this.enable(this.props.message);
    } else {
      this.disable();
    }
  }

  componentWillUnmount() {
    this.disable();
  }

  render() {
    return null;
  }
}

export default Prompt;
