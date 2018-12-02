import React, { Component } from "react";
import PropTypes from "prop-types";
import SandboxExample from "./SandboxExample";
import { Redirect } from "react-router-dom";

class Example extends Component {
  static propTypes = {
    data: PropTypes.object,
    match: PropTypes.shape({
      params: PropTypes.shape({
        example: PropTypes.string,
        environment: PropTypes.string
      })
    })
  };

  render() {
    const {
      data,
      match: {
        params: { example: exampleParam, environment }
      }
    } = this.props;
    const example = data.examples.find(e => e.slug === exampleParam);
    const isNative = environment === "native";
    return example ? (
      isNative ? (
        <SandboxExample
          label={example.label}
          path={example.path}
          dependencies={{
            "react-router-native": "latest",
            "react-native-web": "latest",
            "react-art": "latest",
            "react-scripts": "2.0.0",
            ...(example.extraDependencies || {})
          }}
          code={example.code}
          extraEmbedOptions={{ editorsize: 66, hidenavigation: true }}
        />
      ) : (
        <SandboxExample
          label={example.label}
          path={example.path}
          dependencies={{
            "react-router-dom": "latest",
            "react-scripts": "2.0.0",
            ...(example.extraDependencies || {})
          }}
          code={example.code}
        />
      )
    ) : (
      <Redirect to={`/${environment}/example/${data.examples[0].slug}`} />
    );
  }
}

export default Example;
