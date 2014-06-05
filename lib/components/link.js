var React = require('react');
var invariant = require('react/lib/invariant');
var path = require('../path');
var urlStore = require('../stores/url-store');

var RESERVED_PROPS = {
  activeClassName: true,
  to: true,
  query: true,
  children: true // ReactChildren
};

var Link = React.createClass({

  statics: {

    /**
     * Returns an href that can be used to link to the given path or
     * route name, params, and query.
     */
    makeHref: function (to, params, query) {
      return makeHref(resolveTo(to), params, query);
    }

  },

  propTypes: {
    activeClassName: React.PropTypes.string.isRequired,
    to: React.PropTypes.string,
    query: React.PropTypes.object
  },

  getDefaultProps: function () {
    return {
      activeClassName: 'active'
    };
  },

  getInitialState: function () {
    return {
      isActive: false
    };
  },

  /**
   * Returns the path this <Link> uses to match the URL.
   */
  getPath: function () {
    if (this.props.to)
      return resolveTo(this.props.to);

    return '';
  },

  /**
   * Returns a hash of URL parameters this <Link> interpolates into its path (see getPath).
   */
  getParams: function () {
    var props = this.props;
    var params = {};

    for (var name in props) {
      if (!RESERVED_PROPS[name]) {
        params[name] = props[name];
      }
    }

    return params;
  },

  /**
   * Returns a hash of query string parameters this <Link> appends to its path (see getPath).
   */
  getQuery: function () {
    return this.props.query;
  },

  /**
   * Returns the value of the "href" attribute to use on the <a> element.
   */
  getHref: function () {
    return makeHref(this.getPath(), this.getParams(), this.getQuery());
  },

  /**
   * Returns the value of the "class" attribute to use on the <a> element, which contains
   * the value of the "activeClassName" property when this <Link> is active.
   */
  getClassName: function () {
    var className = this.props.className || '';

    if (this.state.isActive)
      return className + ' ' + this.props.activeClassName;

    return className;
  },

  componentWillMount: function () {
    urlStore.addChangeListener(this.handleRouteChange);
    this.updateActive(urlStore.getCurrentPath());
  },

  componentWillUnmount: function () {
    urlStore.removeChangeListener(this.handleRouteChange);
  },

  handleRouteChange: function () {
    this.updateActive(urlStore.getCurrentPath());
  },

  updateActive: function (currentPath) {
    // Make sure this link's params are present in the URL.
    var params = path.extractParams(this.getPath(), path.withoutQuery(currentPath));
    var isActive = !!(params && hasUriProperties(params, this.getParams()));

    if (isActive) {
      var query = this.getQuery();
      var activeQuery = path.extractQuery(currentPath);

      // Make sure this link's query is in the URL, if it has one.
      if (query)
        isActive = !!(activeQuery && hasUriProperties(activeQuery, query));
    }

    this.setState({
      isActive: isActive
    });
  },

  follow: function () {
    urlStore.push(this.getHref());
  },

  handleClick: function (event) {
    if (!isModifiedEvent(event)) {
      event.preventDefault();
      this.follow();
    }
  },

  render: function () {
    var props = {
      href: this.getHref(),
      className: this.getClassName(),
      onClick: this.handleClick
    };

    return React.DOM.a(props, this.props.children);
  }

});

function makeHref(routePath, params, query) {
  var relativePath = path.withQuery(path.injectParams(routePath, params), query);
  var prefix = urlStore.getLocation() === 'history' ? '/' : '#/';

  return prefix + relativePath;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.ctrlKey || event.shiftKey);
}

function hasUriProperties(object, properties) {
  for (var name in object) {
    if (object[name] !== encodeURIComponent(properties[name])) {
      return false;
    }
  }

  return true;
}

var routeStore = require('../stores/route-store');

function resolveTo(to) {
  if (to === '')
    return to;

  if (to.charAt(0) === '/')
    return path.normalize(to); // Absolute path.

  var route = routeStore.getRouteByName(to);

  invariant(
    route,
    'Unable to resolve "to" value "' + to + '". Make sure you have a <Route name="' + to + '"> and that it is mounted.'
  );

  return path.forRoute(route);
}

module.exports = Link;

