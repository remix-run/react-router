import React, { Component } from "react";
import PropTypes from "prop-types";
import { SandboxEmbed } from "@codesandbox/react-embed";
import NativeExample from "./NativeExample";
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
        <NativeExample example={example} />
      ) : (
        <SandboxEmbed
          sandboxOptions={{
            name: `React Router - ${example.label}`,
            examplePath: example.path,
            gitInfo: {
              account: "ReactTraining",
              repository: "react-router",
              host: "github"
            },
            dependencies: {
              "react-router-dom": "latest",
              ...(example.extraDependencies || {})
            },
            example: example.code
          }}
          embedOptions={{
            codemirror: true,
            fontsize: 14
          }}
          height="100vh"
        >
          <div
            style={{
              width: "100%",
              height: "100vh",
              backgroundColor: "#1C1F21"
            }}
          />
        </SandboxEmbed>
      )
    ) : (
      <Redirect to={`/${environment}/example/${data.examples[0].slug}`} />
    );
  }
}

export default Example;
