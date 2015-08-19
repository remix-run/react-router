import React, { Component, PropTypes, createElement } from 'react';
import * as RouterPropTypes from './PropTypes';
import { stringifyQuery } from './QueryUtils';

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
 *   <Link to="/posts/123" query={{ show: true }}/>
 */
export default class Link extends Component {
  static contextTypes = {
    router: RouterPropTypes.router,
    history: RouterPropTypes.history
  }

  static propTypes = {
    activeStyle: PropTypes.object,
    activeClassName: PropTypes.string,
    to: PropTypes.string.isRequired,
    query: PropTypes.object,
    state: PropTypes.object,
    onClick: PropTypes.func
  }

  static defaultProps = {
    className: '',
    activeClassName: 'active',
    style: {}
  }

  handleClick = event => {
    const { onClick, to, query, state } = this.props;
    const { history, router } = this.context;
    let allowTransition = true;
    let clickResult;

    if (this.props.onClick) {
      clickResult = onClick(event);
    }
    if (isModifiedEvent(event) || !isLeftClickEvent(event)) {
      return;
    }
    if (clickResult === false || event.defaultPrevented === true) {
      allowTransition = false;
    }

    event.preventDefault();

    if (allowTransition) {
      history.transitionTo(to, query, state);
    }
  }

  createHref(pathname, query) {
    const { history } = this.context;

    // In the absence of a history, <Link>s need a way to create hrefs — e.g. for
    // server-side rendering. For now we'll just inline a fallback. This is a
    // temporary solution until we figure out a better one.
    // TODO: get rid of this
    if (!history) {
      let queryString;
      if (query == null || (queryString = stringifyQuery(query)) === '') {
        return pathname;
      }
      return pathname + (pathname.indexOf('?') === -1 ? '?' : '&') + queryString;
    }

    return history.createHref(pathname, query);
  }

  render() {
    var { router } = this.context;

    var props = Object.assign({}, this.props, {
      onClick: this.handleClick
    });

    // Ignore if rendered outside of the context of a
    // router, simplifies unit testing.
    if (router) {
      var { to, query } = this.props;

      props.href = this.createHref(to, query);

      if (router.isActive(to, query)) {
        if (props.activeClassName)
          props.className += props.className !== '' ? ` ${props.activeClassName}` : props.activeClassName;

        if (props.activeStyle)
          props.style = Object.assign({}, props.style, props.activeStyle);
      }
    }

    return createElement('a', props);

    // const { router } = this.context;
    // const props = {
    //   ...this.props,
    //   onClick: this.handleClick
    // };
    //
    // // Ignore if rendered outside of the context of a router, simplifies
    // // unit testing.
    // if (router) {
    //   const { to, query } = this.props;
    //
    //   props.href = this.createHref(to, query);
    //
    //   if (router.isActive(to, query)) {
    //     if (props.activeClassName) {
    //       props.className += props.className !== '' ? ` ${props.activeClassName}` : props.activeClassName;
    //     }
    //
    //     if (props.activeStyle) {
    //       props.style = {
    //         ...props.style,
    //         ...props.activeStyle
    //       };
    //     }
    //   }
    // }
    //
    // return <a {...props} />;
  }
}
