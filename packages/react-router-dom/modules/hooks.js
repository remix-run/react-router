import React from "react";
import { useLocation, useHistory } from "react-router";
import invariant from "tiny-invariant";
import { getNavigator } from "./utils/locationUtils.js";

const useCallback = React.useCallback;

export function useNavigate() {
  if (__DEV__) {
    invariant(
      typeof useCallback === "function",
      "You must use React >= 16.8 in order to use useNavigate()"
    );
  }
  const location = useLocation();
  const history = useHistory();
  const navigate = useCallback(
    (to, { replace = false } = {}) => {
      return getNavigator(history, location)(to, { replace });
    },
    [location, history]
  );

  return navigate;
}
