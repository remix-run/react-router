import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";

import RouterContext from "./RouterContext";

class Block extends React.Component {
  constructor(props) {
    super(props);
    this.release = props.method(props.message);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.message !== this.props.message) {
      this.release();
      this.release = this.props.method(this.props.message);
    }
  }

  componentWillUnmount() {
    this.release();
  }

  render() {
    return null;
  }
}

if (__DEV__) {
  const messageType = PropTypes.oneOfType([PropTypes.func, PropTypes.string]);

  Block.propTypes = {
    method: PropTypes.func.isRequired,
    message: messageType.isRequired
  };
}

/**
 * The public API for prompting the user before navigating away from a screen.
 */
function Prompt(props) {
  return (
    <RouterContext.Consumer>
      {router => {
        invariant(router, "You should not use <Prompt> outside a <Router>");

        return props.when ? (
          <Block method={router.history.block} message={props.message} />
        ) : null;
      }}
    </RouterContext.Consumer>
  );
}

Prompt.defaultProps = {
  when: true
};

if (__DEV__) {
  const messageType = PropTypes.oneOfType([PropTypes.func, PropTypes.string]);

  Prompt.propTypes = {
    when: PropTypes.bool,
    message: messageType.isRequired
  };
}

export default Prompt;
