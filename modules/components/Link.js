var React = require('react');
var classSet = require('react/lib/cx');
var assign = require('react/lib/Object.assign');
var PropTypes = require('../PropTypes');

function isLeftClickEvent(event) {
  return event.button === 0;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

/**
 * <Link> components are used to create an <a> element that links to a route.
 * When that route is active, the link gets an "active" class name (or the
 * value of its `activeClassName` prop).
 *
 * For example, assuming you have the following route:
 *
 *   <Route name="showPost" path="/posts/:postID" handler={Post}/>
 *
 * You could use the following component to link to that route:
 *
 *   <Link to="showPost" params={{ postID: "123" }} />
 *
 * In addition to params, links may pass along query string parameters
 * using the `query` prop.
 *
 *   <Link to="showPost" params={{ postID: "123" }} query={{ show:true }}/>
 */
class Link extends React.Component {

  handleClick(event) {
    var allowTransition = true;
    var clickResult;

    if (this.props.onClick)
      clickResult = this.props.onClick(event);

    if (isModifiedEvent(event) || !isLeftClickEvent(event))
      return;

    if (clickResult === false || event.defaultPrevented === true)
      allowTransition = false;

    event.preventDefault();

    if (allowTransition)
      this.context.router.transitionTo(this.props.to, this.props.params, this.props.query);
  }

  /**
   * Returns the value of the "href" attribute to use on the DOM element.
   */
  getHref() {
    return this.context.router.makeHref(this.props.to, this.props.params, this.props.query);
  }

  /**
   * Returns the value of the "class" attribute to use on the DOM element, which contains
   * the value of the activeClassName property when this <Link> is active.
   */
  getClassName() {
    var classNames = {};

    if (this.props.className)
      classNames[this.props.className] = true;

    if (this.getActiveState())
      classNames[this.props.activeClassName] = true;

    return classSet(classNames);
  }

  getActiveState() {
    return this.context.router.isActive(this.props.to, this.props.params, this.props.query);
  }

  render() {
    var props = assign({}, this.props, {
      href: this.getHref(),
      className: this.getClassName(),
      onClick: this.handleClick.bind(this)
    });

    if (props.activeStyle && this.getActiveState())
      props.style = props.activeStyle;

    return React.DOM.a(props, this.props.children);
  }

}

// TODO: Include these in the above class definition
// once we can use ES7 property initializers.
// https://github.com/babel/babel/issues/619

Link.contextTypes = {
  router: PropTypes.router.isRequired
};

Link.propTypes = {
  activeClassName: PropTypes.string.isRequired,
  to: PropTypes.oneOfType([ PropTypes.string, PropTypes.route ]).isRequired,
  params: PropTypes.object,
  query: PropTypes.object,
  activeStyle: PropTypes.object,
  onClick: PropTypes.func
};

Link.defaultProps = {
  activeClassName: 'active'
};

module.exports = Link;
