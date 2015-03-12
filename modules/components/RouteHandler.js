var React = require('react');
var assign = require('react/lib/Object.assign');
var PropTypes = require('../PropTypes');

var REF_NAME = '__routeHandler__';

/**
 * A <RouteHandler> component renders the active child route handler
 * when routes are nested.
 */
class RouteHandler extends React.Component {

  getChildContext() {
    return {
      routeDepth: this.context.routeDepth + 1
    };
  }

  componentDidMount() {
    this._updateRouteComponent(this.refs[REF_NAME]);
  }

  componentDidUpdate() {
    this._updateRouteComponent(this.refs[REF_NAME]);
  }

  componentWillUnmount() {
    this._updateRouteComponent(null);
  }

  _updateRouteComponent(component) {
    this.context.router.setRouteComponentAtDepth(this.getRouteDepth(), component);
  }

  getRouteDepth() {
    return this.context.routeDepth;
  }

  createChildRouteHandler(props) {
    var route = this.context.router.getRouteAtDepth(this.getRouteDepth());
    return route ? React.createElement(route.handler, assign({}, props || this.props, { ref: REF_NAME })) : null;
  }

  render() {
    // IMPORTANT: This span "soaks" up owner context, keeping
    // React 0.13.0 from throwing a warning.
    // TODO: Why should this even be necessary?
    return <span>{ this.createChildRouteHandler() }</span>
  }

}

// TODO: Include these in the above class definition
// once we can use ES7 property initializers.
// https://github.com/babel/babel/issues/619

RouteHandler.contextTypes = {
  routeDepth: PropTypes.number.isRequired,
  router: PropTypes.router.isRequired
};

RouteHandler.childContextTypes = {
  routeDepth: PropTypes.number.isRequired
};

module.exports = RouteHandler;
