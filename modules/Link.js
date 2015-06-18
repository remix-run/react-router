import React from 'react';

var { object, string, func } = React.PropTypes;

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
 *   <Link to={`/posts/${post.id}`} />
 *
 * Links may pass along query string parameters
 * using the `query` prop.
 *
 *   <Link to="/posts/123" query={{ show:true }}/>
 */
export var Link = React.createClass({

  contextTypes: {
    router: object
  },

  propTypes: {
    activeStyle: object,
    activeClassName: string,
    to: string.isRequired,
    query: object,
    state: object,
    onClick: func
  },

  getDefaultProps() {
    return {
      className: '',
      activeClassName: 'active',
      style: {}
    };
  },

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
      this.context.router.transitionTo(this.props.to, this.props.query, this.props.state);
  },

  render() {
    var { router } = this.context;
    var { to, query } = this.props;

    var props = Object.assign({}, this.props, {
      href: router.makeHref(to, query),
      onClick: this.handleClick
    });

    // ignore if rendered outside of the context of a router, simplifies unit testing
    if (router && router.isActive(to, query)) {
      if (props.activeClassName)
        props.className += ` ${props.activeClassName}`;

      if (props.activeStyle)
        Object.assign(props.style, props.activeStyle);
    }

    return React.createElement('a', props);
  }

});

export default Link;
