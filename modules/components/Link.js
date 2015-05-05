var React = require('react');
var { object, string, func, oneOfType } = React.PropTypes;
var assign = require('object-assign');

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

  static contextTypes = {
    router: object.isRequired
  }
  
  static propTypes = {
    activeStyle: object,
    activeClassName: string,
    to: oneOfType([ string, object ]).isRequired,
    params: object,
    query: object,
    onClick: func
  }
  
  static defaultProps = {
    activeClassName: 'active'
  }

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

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

  getHref() {
    return this.context.router.makeHref(this.props.to, this.props.params, this.props.query);
  }

  isActive() {
    return this.context.router.isActive(this.props.to, this.props.params, this.props.query);
  }

  render() {
    var props = assign({}, this.props, {
      href: this.getHref(),
      onClick: this.handleClick
    });

    if (this.isActive()) {
      if (props.activeClassName)
        props.className = (props.className ? `${props.className} ${props.activeClassName}` : props.activeClassName);

      if (props.activeStyle)
        props.style = props.activeStyle;
    }

    return React.DOM.a(props, this.props.children);
  }

}

module.exports = Link;
