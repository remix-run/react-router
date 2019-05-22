import React from "react";
import { BackHandler } from "react-native";

import { __FOR_INTERNAL_USE_ONLY__ } from "react-router";

const { RouterContext } = __FOR_INTERNAL_USE_ONLY__;

class BackButton extends React.Component {
  handleBack = () => {
    if (this.history.index === 0) {
      return false; // home screen
    } else {
      this.history.goBack();
      return true;
    }
  };

  componentDidMount() {
    BackHandler.addEventListener("hardwareBackPress", this.handleBack);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener("hardwareBackPress", this.handleBack);
  }

  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          this.history = context.history;
          return this.props.children || null;
        }}
      </RouterContext.Consumer>
    );
  }
}

export default BackButton;
