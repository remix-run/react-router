var React = require('react');
var ActiveStore = require('../stores/ActiveStore');
var withoutProperties = require('../helpers/withoutProperties');
var transitionTo = require('../helpers/transitionTo');
var makeHref = require('../helpers/makeHref');

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

  statics: {

    getUnreservedProps: function (props) {
      return withoutProperties(props, RESERVED_PROPS);
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

  componentWillMount: function () {
    ActiveStore.addChangeListener(this.handleActiveChange);
  },

  componentDidMount: function () {
    this.updateActive();
  },

  componentWillUnmount: function () {
    ActiveStore.removeChangeListener(this.handleActiveChange);
  },

  handleActiveChange: function () {
    if (this.isMounted())
      this.updateActive();
  },

  updateActive: function () {
    this.setState({
      isActive: ActiveStore.isActive(this.props.to, this.getParams(), this.props.query)
    });
  },

  handleClick: function (event) {
    if (isModifiedEvent(event))
      return;

    event.preventDefault();

    transitionTo(this.props.to, this.getParams(), this.props.query);
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

module.exports = Link;
