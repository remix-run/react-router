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
    message: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    beforeUnload: propTypes.bool
  };

  static defaultProps = {
    when: true,
    beforeUnload: false
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

  handleBeforeUnload = () => {
    if (this.props.when) {
      return typeof this.props.message === 'function'
        ? this.props.message()
        : this.props.message;
    }
  }

  componentWillMount() {
    invariant(
      this.context.router,
      "You should not use <Prompt> outside a <Router>"
    );

    if (this.props.when) this.enable(this.props.message);
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.when) {
      if (!this.props.when || this.props.message !== nextProps.message)
        this.enable(nextProps.message);
    } else {
      this.disable();
    }
  }

  componentWillUnmount() {
    this.disable();
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  render() {
    return null;
  }
}

export default Prompt;
