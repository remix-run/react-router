import React from "react";
import { __RouterContext as RouterContext } from "react-router";
import PropTypes from "prop-types";
import invariant from "tiny-invariant";
import { resolveToLocation, normalizeToLocation } from "./utils/locationUtils";

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

/**
 * The public API for rendering a history-aware <a>.
 */
class Link extends React.Component {
  handleClick(event, context) {
    try {
      if (this.props.onClick) this.props.onClick(event);
    } catch (ex) {
      event.preventDefault();
      throw ex;
    }

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore everything but left clicks
      (!this.props.target || this.props.target === "_self") && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();

      const location = resolveToLocation(this.props.to, context.location);

      const method = this.props.replace
        ? context.history.replace
        : context.history.push;

      method(location);
    }
  }

  render() {
    const { innerRef, replace, to, ...rest } = this.props; // eslint-disable-line no-unused-vars

    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Link> outside a <Router>");

          const location = normalizeToLocation(
            resolveToLocation(to, context.location),
            context.location
          );

          const href = location ? context.history.createHref(location) : "";

          return (
            <a
              {...rest}
              onClick={event => this.handleClick(event, context)}
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
  const toType = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.func
  ]);
  const innerRefType = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]);

  Link.propTypes = {
    innerRef: innerRefType,
    onClick: PropTypes.func,
    replace: PropTypes.bool,
    target: PropTypes.string,
    to: toType.isRequired
  };
}

export default Link;
