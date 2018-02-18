import warning from "warning";
import invariant from "invariant";
import React from "react";
import PropTypes from "prop-types";
import matchPath from "./matchPath";
import pathToRegexp from "path-to-regexp";

const querystring = require('querystring');

const isEmptyChildren = children => React.Children.count(children) === 0;

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  static propTypes = {
    args: PropTypes.object, 
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

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
      route: PropTypes.object.isRequired,
      staticContext: PropTypes.object
    })
  };

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  getChildContext() {
    return {
      router: {
        ...this.context.router,
        route: {
          location: this.props.location || this.context.router.route.location,
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props, this.context.router)
  };


  computeMatch(
    { computedMatch, args, location, path, strict, exact, sensitive },
    router
  ) {
    if (computedMatch) return computedMatch; // <Switch> already computed the match for us

    invariant(
      router,
      "You should not use <Route> or withRouter() outside a <Router>"
    );

    const { route } = router;
    const pathname = (location || route.location).pathname;

    if (args) path = this.pathWithArgs(path, args)
//    console.log({pathname, path, route, strict, exact, sensitive})    
    let result = path
      ? matchPath(pathname, { path, strict, exact, sensitive, args })
      : route.match;

    if (!args) return result;

    return this.extractArgs(result, args)
  }

  pathWithArgs(path, args) {
    let p = path;
    p = `${p}.:args([^/]+)?`
    return p;
  }

  extractArgs(result, args) {
    let parsedArgs = querystring.parse(result.params.args, '.', '-');
    delete result.params.args
    result.params = {...result.params, ...parsedArgs};

    for (var k in args) {
      const hasOverride = result.params.hasOwnProperty(k);
      const argConfig = args[k];
      let argRequired = false;
      let defVal;
      if (typeof argConfig !== "object") {
        defVal = argConfig;
      } else {
        argRequired = argConfig.required;  
        defVal = argConfig.hasOwnProperty('default') ? argConfig.default : undefined;
      }

      if (argRequired) {
        if (!result.params[k]) {
          result.params[k] = defVal;
        }
      } else if (!hasOverride) {
        if (typeof defVal !== "undefined") {
          result.params[k] = defVal
        }
      }
    }
    // console.log(result.params);

    return result;
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

  componentWillReceiveProps(nextProps, nextContext) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!nextProps.location && this.props.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );

    this.setState({
      match: this.computeMatch(nextProps, nextContext.router)
    });
  }
  
  render() {
    const { match } = this.state;
    const { children, component, render, args={} } = this.props;
    const { history, route, staticContext } = this.context.router;
    const location = this.props.location || route.location;
    const update = ({...newArgs}) => {
      const mergedArgs = {...match.params, ...newArgs}
      const filledArgs = querystring.stringify(mergedArgs, ".", "-");

      const remainder = location.pathname.substr(match.url.length) 
      const partialPath = (match.path + remainder)
      
      var rawPathUpdater = pathToRegexp.compile(partialPath)
      var rawArg = { args: filledArgs }
      return rawPathUpdater(rawArg)
    }

    const props = { match, location, history, staticContext, update, args };

    if (component) return match ? React.createElement(component, props) : null;



    if (render) return match ? render(props) : null;

    if (typeof children === "function") return children(props);

    if (children && !isEmptyChildren(children))
      return React.Children.only(children);

    return null;
  }
}

export default Route;
