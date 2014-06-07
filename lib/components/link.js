var React = require('react');
var invariant = require('react/lib/invariant');
var urlStore = require('../stores/url-store');
var path = require('../path');
var Router = require('../router');

var RESERVED_PROPS = {
  to: true,
  activeClassName: true,
  query: true,
  children: true // ReactChildren
};

var Link = React.createClass({

  statics: {

    getUnreservedProps: function (props) {
      var unreservedProps = {};

      for (var name in props) {
        if (!RESERVED_PROPS[name]) {
          unreservedProps[name] = props[name];
        }
      }

      return unreservedProps;
    },

    /**
     * Given the current path, returns true if a link with the given pattern,
     * params, and query is considered "active".
     */
    isActive: function (currentPath, pattern, params, query) {
      var result = (path.injectParams(pattern, params) === path.withoutQuery(currentPath));

      if (result && query)
        result = queryHasProperties(path.extractQuery(currentPath), query);

      return result;
    }

  },

  propTypes: {
    to: React.PropTypes.string.isRequired,
    activeClassName: React.PropTypes.string.isRequired,
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
   * Returns the pattern this <Link> uses to match the URL.
   */
  getPattern: function () {
    return Router.resolveTo(this.props.to);
  },

  /**
   * Returns a hash of URL parameters in this <Link>'s pattern (see getPattern).
   */
  getParams: function () {
    return Link.getUnreservedProps(this.props);
  },

  /**
   * Returns a hash of query string parameters this <Link> appends to its path.
   */
  getQuery: function () {
    return this.props.query;
  },

  /**
   * Returns the value of the "href" attribute to use on the DOM element.
   */
  getHref: function () {
    return Router.makeHref(this.props.to, this.getParams(), this.getQuery());
  },

  /**
   * Returns the value of the "class" attribute to use on the DOM element, which contains
   * the value of the activeClassName property when this <Link> is active.
   */
  getClassName: function () {
    var className = this.props.className || '';

    if (this.state.isActive)
      return className + ' ' + this.props.activeClassName;

    return className;
  },

  componentWillMount: function () {
    urlStore.addChangeListener(this.handleRouteChange);
  },

  componentDidMount: function () {
    this.updateActive(urlStore.getCurrentPath());
  },

  componentWillUnmount: function () {
    urlStore.removeChangeListener(this.handleRouteChange);
  },

  handleRouteChange: function () {
    if (this.isMounted())
      this.updateActive(urlStore.getCurrentPath());
  },

  updateActive: function (currentPath) {
    this.setState({
      isActive: Link.isActive(currentPath, this.getPattern(), this.getParams(), this.getQuery())
    });
  },

  handleClick: function (event) {
    if (!isModifiedEvent(event)) {
      event.preventDefault();
      Router.transitionTo(this.props.to, this.getParams(), this.getQuery());
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

function isModifiedEvent(event) {
  return !!(event.metaKey || event.ctrlKey || event.shiftKey);
}

function queryHasProperties(query, properties) {
  if (!query)
    return false;

  for (var property in properties) {
    if (query[property] !== String(properties[property]))
      return false;
  }

  return true;
}

module.exports = Link;

