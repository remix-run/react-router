var React = require('react');
var ContextWrapper = require('./ContextWrapper')
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

    if (route == null)
      return null;

    var childProps = assign({}, props || this.props, {
      ref: REF_NAME,
      params: this.context.router.getCurrentParams(),
      query: this.context.router.getCurrentQuery()
    });

    return React.createElement(route.handler, childProps);
  }

  render() {
    var handler = this.createChildRouteHandler();
    // <script/> for things like <CSSTransitionGroup/> that don't like null
    return handler ? <ContextWrapper>{handler}</ContextWrapper> : <script/>;
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
