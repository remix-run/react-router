import React from "react";
import { Alert } from "react-native";
import { MemoryRouter } from "react-router";
import PropTypes from "prop-types";

/**
 * The public API for a <Router> designed for React Native. Gets
 * user confirmations via Alert by default.
 */
function NativeRouter(props) {
  return <MemoryRouter {...props} />;
}

NativeRouter.defaultProps = {
  getUserConfirmation: (message, callback) => {
    Alert.alert("Confirm", message, [
      { text: "Cancel", onPress: () => callback(false) },
      { text: "OK", onPress: () => callback(true) }
    ]);
  }
};

const __DEV__ = true; // TODO

if (__DEV__) {
  NativeRouter.propTypes = {
    initialEntries: PropTypes.array,
    initialIndex: PropTypes.number,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number,
    children: PropTypes.node
  };
}

export default NativeRouter;
