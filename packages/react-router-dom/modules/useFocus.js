import React, { useContext, useRef, useLayoutEffect, useState } from "react";
import { __RouterContext as RouterContext } from "react-router";
import invariant from "tiny-invariant";
import warning from "tiny-warning";
import { locationsAreEqual } from "history";

export default function useFocus(options = {}) {
  invariant(
    typeof useContext === "function",
    "The useFocus hook requires React 16.7 or greater"
  );

  const { preventScroll = false, preserve = false } = options;

  const { location } = useContext(RouterContext);
  const [prevLocation, setPrevLocation] = useState({});
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (locationsAreEqual(location, prevLocation)) {
      return;
    }
    setPrevLocation(location);

    const ele = ref.current;
    if (ele != null) {
      warning(
        ele.hasAttribute("tabIndex") || ele.tabIndex !== -1,
        'The ref must be assigned an element with the "tabIndex" attribute or be focusable by default in order to be focused. ' +
          "Otherwise, the document's <body> will be focused instead."
      );

      if (preserve && ele.contains(document.activeElement)) {
        return;
      }

      setTimeout(() => {
        ele.focus({ preventScroll });
      });
    } else {
      warning(
        false,
        "There is no element to focus. Did you forget to add the ref to an element?"
      );
    }
  });

  return ref;
}
