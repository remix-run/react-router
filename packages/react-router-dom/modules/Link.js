import React from "react";
import { __RouterContext as RouterContext } from "react-router";
import { createLocation } from "history";
import PropTypes from "prop-types";
import invariant from "tiny-invariant";

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

/**
 * The public API for rendering a history-aware <a>.
 */
function Link(props) {
  const { innerRef, replace, to, ...rest } = props;

  return (
    <RouterContext.Consumer>
      {context => {
        invariant(context, "You should not use <Link> outside a <Router>");

        const history = context.history;

        const handleClick = event => {
          if (props.onClick) props.onClick(event);

          if (
            // onClick prevented default
            !event.defaultPrevented &&
            // ignore everything but left clicks
            event.button === 0 &&
            // let browser handle "target=_blank" etc.
            (!props.target || props.target === "_self") &&
            // ignore clicks with modifier keys
            !isModifiedEvent(event)
          ) {
            event.preventDefault();

            const method = props.replace ? history.replace : history.push;

            method(props.to);
          }
        };

        const location =
          typeof to === "string"
            ? createLocation(to, null, null, context.location)
            : to;
        const href = location ? history.createHref(location) : "";

        return <a {...rest} onClick={handleClick} href={href} ref={innerRef} />;
      }}
    </RouterContext.Consumer>
  );
}

if (__DEV__) {
  const toType = PropTypes.oneOfType([PropTypes.string, PropTypes.object]);
  const innerRefType = PropTypes.oneOfType([PropTypes.string, PropTypes.func]);

  Link.propTypes = {
    innerRef: innerRefType,
    onClick: PropTypes.func,
    replace: PropTypes.bool,
    target: PropTypes.string,
    to: toType.isRequired
  };
}

export default Link;
