var React = require('react');
var ActiveState = require('../mixins/ActiveState');
var withoutProperties = require('../helpers/withoutProperties');
var transitionTo = require('../helpers/transitionTo');
var hasOwnProperty = require('../helpers/hasOwnProperty');
var makeHref = require('../helpers/makeHref');

function isLeftClickEvent(event) {
  return event.button === 0;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

/**
 * A map of <Link> component props that are reserved for use by the
 * router and/or React. All other props are used as params that are
 * interpolated into the link's path.
 */
var RESERVED_PROPS = {
  to: true,
  className: true,
  activeClassName: true,
  query: true,
  children: true // ReactChildren
};

/**
 * <Link> components are used to create an <a> element that links to a route.
 * When that route is active, the link gets an "active" class name (or the
 * value of its `activeClassName` prop).
 *
 * For example, assuming you have the following route:
 *
 *   <Route name="showPost" path="/posts/:postId" handler={Post}/>
 *
 * You could use the following component to link to that route:
 *
 *   <Link to="showPost" postId="123"/>
 *
 * In addition to params, links may pass along query string parameters
 * using the `query` prop.
 *
 *   <Link to="showPost" postId="123" query={{show:true}}/>
 */
var Link = React.createClass({

  displayName: 'Link',

  mixins: [ ActiveState ],

  statics: {

    getUnreservedProps: function (props) {
      return withoutProperties(props, RESERVED_PROPS);
    }

  },

  propTypes: {
    to: React.PropTypes.string.isRequired,
    activeClassName: React.PropTypes.string.isRequired,
    query: React.PropTypes.object,
    onClick: React.PropTypes.func
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
   * Returns a hash of URL parameters to use in this <Link>'s path.
   */
  getParams: function () {
    return Link.getUnreservedProps(this.props);
  },

  /**
   * Returns the value of the "href" attribute to use on the DOM element.
   */
  getHref: function () {
    return makeHref(this.props.to, this.getParams(), this.props.query);
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

  componentWillReceiveProps: function (nextProps) {
    var params = Link.getUnreservedProps(nextProps);

    this.setState({
      isActive: Link.isActive(nextProps.to, params, nextProps.query)
    });
  },

  updateActiveState: function () {
    this.setState({
      isActive: Link.isActive(this.props.to, this.getParams(), this.props.query)
    });
  },

  handleClick: function (event) {
    var allowTransition = true;
    var ret;

    if (this.props.onClick)
      ret = this.props.onClick(event);

    if (isModifiedEvent(event) || !isLeftClickEvent(event))
      return;

    if (ret === false || event.defaultPrevented === true)
      allowTransition = false;

    event.preventDefault();

    if (allowTransition)
      transitionTo(this.props.to, this.getParams(), this.props.query);
  },

  render: function () {
    var props = {
      href: this.getHref(),
      className: this.getClassName(),
      onClick: this.handleClick
    };

    // pull in props without overriding
    for (var propName in this.props) {
      if (hasOwnProperty(this.props, propName) && hasOwnProperty(props, propName) === false)
        props[propName] = this.props[propName];
    }

    return React.DOM.a(props, this.props.children);
  }

});

module.exports = Link;
