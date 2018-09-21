import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";
import warning from "warning";

import RouterContext from "./RouterContext";
import matchPath from "./matchPath";

const isEmptyChildren = children => React.Children.count(children) === 0;

/**
 * The public API for matching a single path and rendering.
 */
class InnerRoute extends React.Component {
  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  getChildContext() {
    return {
      router: {
        ...this.props.router,
        route: {
          location: this.props.location || this.props.router.route.location,
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props)
  };

  computeMatch({
    computedMatch,
    router,
    location,
    path,
    strict,
    exact,
    sensitive
  }) {
    if (computedMatch) return computedMatch; // <Switch> already computed the match for us

    invariant(
      router,
      "You should not use <Route> or withRouter() outside a <Router>"
    );

    const { route } = router;
    const pathname = (location || route.location).pathname;

    return matchPath(pathname, { path, strict, exact, sensitive }, route.match);
  }

  componentWillMount() {
    warning(
      !(this.props.component && this.props.render),
      "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored"
    );

    warning(
      !(
        this.props.component &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route component> and <Route children> in the same route; <Route children> will be ignored"
    );

    warning(
      !(
        this.props.render &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route render> and <Route children> in the same route; <Route children> will be ignored"
    );
  }

  componentWillReceiveProps(nextProps) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!nextProps.location && this.props.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );

    this.setState({
      match: this.computeMatch(nextProps)
    });
  }

  renderChildren() {
    const { match } = this.state;
    const {
      children,
      component,
      render,
      router: { history, route, staticContext }
    } = this.props;
    const location = this.props.location || route.location;
    const props = { match, location, history, staticContext };

    if (component) return match ? React.createElement(component, props) : null;

    if (render) return match ? render(props) : null;

    if (typeof children === "function") return children(props);

    if (children && !isEmptyChildren(children))
      return React.Children.only(children);

    return null;
  }

  render() {
    return (
      <RouterContext.Provider value={this.getChildContext().router}>
        {this.renderChildren()}
      </RouterContext.Provider>
    );
  }
}

if (__DEV__) {
  InnerRoute.propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    path: PropTypes.string,
    exact: PropTypes.bool,
    strict: PropTypes.bool,
    sensitive: PropTypes.bool,
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    location: PropTypes.object
  };
}

const Route = props => (
  <RouterContext.Consumer>
    {router => <InnerRoute {...props} router={router} />}
  </RouterContext.Consumer>
);

export default Route;
