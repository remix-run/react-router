import { useContext, version as REACT_VERSION } from "react";
import invariant from "tiny-invariant";

import RouterContext from "./RouterContext";

// needed for ESM builds
let useRouter = null;

if (useContext) {
  useRouter = function useRouter() {
    const context = useContext(RouterContext);
    invariant(context, "You should not use useRouter() outside a <Router>");
    return context;
  };
} else {
  useRouter = function useRouter() {
    invariant(
      false,
      "React Hooks require at least React version 16.8.0. " +
        `You are using React version ${REACT_VERSION}.`
    );
  };
}

export default useRouter;
