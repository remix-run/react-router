var React = require('react');
var invariant = require('react/lib/invariant');
var URLStore = require('../stores/URLStore');
var Path = require('../Path');
var Router = require('../Router');

var RESERVED_PROPS = {
  to: true,
  activeClassName: true,
  query: true,
  children: true // ReactChildren
};

/**
 * A Link component is used to create an <a> element that links to a route.
 * When that route is active, the link gets an "active" class name (or the
 * value of its activeClassName prop).
 *
 * For example, assuming you have the following route:
 *
 *   <Route name="showPost" path="/posts/:postId" handler={Post}/>
 *
 * You could use the following link to transition to that route:
 * 
 *   <Link to="showPost" postId="123"/>
 *
 * In addition to params, links may pass along query string parameters
 * using the query prop.
 *
 *   <Link to="showPost" postId="123" query={{show:true}}/>
 */
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
      var result = (Path.injectParams(pattern, params) === Path.withoutQuery(currentPath));

      if (result && query)
        result = queryHasProperties(Path.extractQuery(currentPath), query);

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
    URLStore.addChangeListener(this.handleRouteChange);
  },

  componentDidMount: function () {
    this.updateActive(URLStore.getCurrentPath());
  },

  componentWillUnmount: function () {
    URLStore.removeChangeListener(this.handleRouteChange);
  },

  handleRouteChange: function () {
    if (this.isMounted())
      this.updateActive(URLStore.getCurrentPath());
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

