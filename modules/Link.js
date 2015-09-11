import React from 'react';
import warning from 'warning';

var { bool, object, string, func } = React.PropTypes;

function isLeftClickEvent(event) {
  return event.button === 0;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

/**
 * A <Link> is used to create an <a> element that links to a route.
 * When that route is active, the link gets an "active" class name
 * (or the value of its `activeClassName` prop).
 *
 * For example, assuming you have the following route:
 *
 *   <Route path="/posts/:postID" component={Post} />
 *
 * You could use the following component to link to that route:
 *
 *   <Link to={`/posts/${post.id}`} />
 *
 * Links may pass along location state and/or query string parameters
 * in the state/query props, respectively.
 *
 *   <Link ... query={{ show: true }} state={{ the: 'state' }} />
 */
var Link = React.createClass({

  contextTypes: {
    history: object
  },

  propTypes: {
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    to: string.isRequired,
    query: object,
    state: object,
    onClick: func
  },

  getDefaultProps() {
    return {
      className: '',
      activeClassName: 'active',
      onlyActiveOnIndex: false,
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
      this.context.history.pushState(this.props.state, this.props.to, this.props.query);
  },

  componentWillMount() {
    warning(
      this.context.history,
      'A <Link> should not be rendered outside the context of history; ' +
      'some features including real hrefs, active styling, and navigation ' +
      'will not function correctly'
    );
  },

  render() {
    var { to, query } = this.props;

    var props = {
      ...this.props,
      onClick: this.handleClick
    };

    var { history } = this.context;

    // Ignore if rendered outside the context
    // of history, simplifies unit testing.
    if (history) {
      props.href = history.createHref(to, query);

      if (history.isActive(to, query, onlyActiveOnIndex)) {
        if (props.activeClassName)
          props.className += props.className !== '' ? ` ${props.activeClassName}` : props.activeClassName;

        if (props.activeStyle)
          props.style = { ...props.style, ...props.activeStyle };
      }
    }

    return React.createElement('a', props);
  }

});

export default Link;
