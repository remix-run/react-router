import React from "react";
import PropTypes from "prop-types";
import { SandboxEmbed } from "@codesandbox/react-embed";

export default function SandboxExample({
  label,
  path,
  dependencies,
  code,
  extraEmbedOptions = {}
}) {
  return (
    <SandboxEmbed
      sandboxOptions={{
        name: `React Router - ${label}`,
        examplePath: path,
        gitInfo: {
          account: "ReactTraining",
          repository: "react-router",
          host: "github"
        },
        dependencies: dependencies,
        example: code
      }}
      embedOptions={{
        codemirror: true,
        fontsize: 14,
        ...extraEmbedOptions
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
}

SandboxExample.propTypes = {
  label: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  dependencies: PropTypes.object.isRequired,
  code: PropTypes.string.isRequired,
  extraEmbedOptions: PropTypes.object
};
