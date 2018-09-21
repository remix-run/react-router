import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";
import { createLocation } from "history";
import RouterContext from "./RouterContext";

const isModifiedEvent = event =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

/**
 * The public API for rendering a history-aware <a>.
 */
class Link extends React.Component {
  static defaultProps = {
    replace: false
  };

  handleClick = history => event => {
    if (this.props.onClick) this.props.onClick(event);

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore everything but left clicks
      !this.props.target && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();

      const { replace, to } = this.props;

      if (replace) {
        history.replace(to);
      } else {
        history.push(to);
      }
    }
  };

  render() {
    const { replace, to, innerRef, ...props } = this.props; // eslint-disable-line no-unused-vars

    invariant(to !== undefined, 'You must specify the "to" property');

    return (
      <RouterContext.Consumer>
        {router => {
          invariant(router, "You should not use <Link> outside a <Router>");

          const { history } = router;
          const location =
            typeof to === "string"
              ? createLocation(to, null, null, history.location)
              : to;

          const href = history.createHref(location);
          return (
            <a
              {...props}
              onClick={this.handleClick(history)}
              href={href}
              ref={innerRef}
            />
          );
        }}
      </RouterContext.Consumer>
    );
  }
}

if (__DEV__) {
  Link.propTypes = {
    onClick: PropTypes.func,
    target: PropTypes.string,
    replace: PropTypes.bool,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    innerRef: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
  };
}

export default Link;
