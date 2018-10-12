import React from "react";
import { MemoryRouter } from "react-router";
import { Alert } from "react-native";
import PropTypes from "prop-types";

/**
 * The public API for a <Router> designed for React Native. Gets
 * user confirmations via Alert by default.
 */
const NativeRouter = props => <MemoryRouter {...props} />;

NativeRouter.propTypes = {
  initialEntries: PropTypes.array,
  initialIndex: PropTypes.number,
  getUserConfirmation: PropTypes.func,
  keyLength: PropTypes.number,
  children: PropTypes.node
};

NativeRouter.defaultProps = {
  getUserConfirmation: (message, callback) => {
    Alert.alert("Confirm", message, [
      { text: "Cancel", onPress: () => callback(false) },
      { text: "OK", onPress: () => callback(true) }
    ]);
  }
};

export default NativeRouter;
