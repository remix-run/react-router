import React from "react";
import PropTypes from "prop-types";
import { createLocation, locationsAreEqual } from "history";
import invariant from "invariant";
import warning from "warning";

import RouterContext from "./RouterContext";
import generatePath from "./generatePath";

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
      warning(
        false,
        `You tried to redirect to the same route you're currently on: ` +
          `"${nextTo.pathname}${nextTo.search}"`
      );
      return;
    }

    this.perform();
  }

  computeTo({ computedMatch, to }) {
    if (computedMatch) {
      if (typeof to === "string") {
        return generatePath(to, computedMatch.params);
      } else {
        return {
          ...to,
          pathname: generatePath(to.pathname, computedMatch.params)
        };
      }
    }

    return to;
  }

  perform() {
    const {
      push,
      router: { history }
    } = this.props;
    const to = this.computeTo(this.props);

    if (push) {
      history.push(to);
    } else {
      history.replace(to);
    }
  }

  render() {
    return null;
  }
}

if (__DEV__) {
  InnerRedirect.propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    push: PropTypes.bool,
    from: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired
      }).isRequired,
      staticContext: PropTypes.object
    }).isRequired
  };
}

const Redirect = props => (
  <RouterContext.Consumer>
    {({ router }) => <InnerRedirect {...props} router={router} />}
  </RouterContext.Consumer>
);

export default Redirect;
