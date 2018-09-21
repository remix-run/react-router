import React from "react";
import PropTypes from "prop-types";
import { createLocation, locationsAreEqual } from "history";
import invariant from "invariant";
import warning from "warning";

import RouterContext from "./RouterContext";
import generatePath from "./generatePath";

function computeTo(props) {
  if (props.computedMatch) {
    if (typeof props.to === "string") {
      return generatePath(props.to, props.computedMatch.params);
    } else {
      return {
        ...props.to,
        pathname: generatePath(props.to.pathname, props.computedMatch.params)
      };
    }
  }

  return props.to;
}

/**
 * The public API for updating the location programmatically
 * with a component.
 */
class InnerRedirect extends React.Component {
  static defaultProps = {
    push: false
  };

  isStatic() {
    return this.props.router && this.props.router.staticContext;
  }

  componentWillMount() {
    invariant(
      this.props.router,
      "You should not use <Redirect> outside a <Router>"
    );

    if (this.isStatic()) this.perform();
  }

  componentDidMount() {
    if (!this.isStatic()) this.perform();
  }

  componentDidUpdate(prevProps) {
    const prevTo = createLocation(prevProps.to);
    const nextTo = createLocation(this.props.to);

    if (locationsAreEqual(prevTo, nextTo)) {
      if (__DEV__) {
        warning(
          false,
          `You tried to redirect to the same route you're currently on: ` +
            `"${nextTo.pathname}${nextTo.search}"`
        );
      }

      return;
    }

    this.perform();
  }

  perform() {
    const history = this.props.router.history;
    const to = computeTo(this.props);

    if (this.props.push) {
      history.push(to);
    } else {
      history.replace(to);
    }
  }

  render() {
    return null;
  }
}

function Redirect(props) {
  return (
    <RouterContext.Consumer>
      {router => <InnerRedirect {...props} router={router} />}
    </RouterContext.Consumer>
  );
}

if (__DEV__) {
  Redirect.propTypes = {
    push: PropTypes.bool,
    from: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
  };
}

export default Redirect;
