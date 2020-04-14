import React from "react";
import { Linking } from "react-native";

import { __RouterContext as RouterContext } from "react-router";

const protocolAndSlashes = /.*?:\/\//g;

class DeepLinking extends React.PureComponent {
  push(url) {
    const pathname = url.replace(protocolAndSlashes, "");
    this.history.push(pathname);
  }

  async componentDidMount() {
    const url = await Linking.getInitialURL();
    if (url) this.push(url);
    Linking.addEventListener("url", this.handleChange);
  }

  componentWillUnmount() {
    Linking.removeEventListener("url", this.handleChange);
  }

  handleChange = e => {
    this.push(e.url);
  };

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

export default DeepLinking;
