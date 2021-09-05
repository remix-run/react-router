import React from "react";
import { useHistory } from "react-router";
import invariant from "tiny-invariant";

const useCallback = React.useCallback;

export function useNavigate() {
  if (__DEV__) {
    invariant(
      typeof useCallback === "function",
      "You must use React >= 16.8 in order to use useNavigate()"
    );
  }
  const history = useHistory();
  const navigate = useCallback(
    (to, { replace = false } = {}) => {
      if (replace) {
        history.replace(to);
      } else {
        history.push(to);
      }
    },
    [history]
  );
  return navigate;
}
