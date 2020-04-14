import React from "react";
import { BackHandler } from "react-native";

import { __RouterContext as RouterContext } from "react-router";

class BackButton extends React.PureComponent {
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
