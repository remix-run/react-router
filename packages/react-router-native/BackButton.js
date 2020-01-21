import React from "react";
import { BackHandler } from "react-native";

import { __HistoryContext as HistoryContext } from "react-router";

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
      <HistoryContext.Consumer>
        {history => {
          this.history = history;
          return this.props.children || null;
        }}
      </HistoryContext.Consumer>
    );
  }
}

export default BackButton;
