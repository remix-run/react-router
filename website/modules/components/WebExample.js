import React from "react";
import PropTypes from "prop-types";
import { SandboxEmbed } from "@codesandbox/react-embed";

const WebExample = ({ example }) => (
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
);

WebExample.propTypes = {
  example: PropTypes.object
};

export default WebExample;
