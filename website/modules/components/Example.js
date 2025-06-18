import React from "react";
import { Redirect } from "react-router-dom";
import PropTypes from "prop-types";

import SandboxExample from "./SandboxExample.js";

export default function Example({ data, match }) {
  const { example: exampleParam, environment } = match.params;
  const example = data.examples.find(e => e.slug === exampleParam);
  const isNative = environment === "native";

  return example ? (
    isNative ? (
      <SandboxExample
        label={example.label}
        path={example.path}
        dependencies={{
          "react-router-native": "^5.3.0",
          "react-native-web": "latest",
          "react-art": "latest",
          "react-scripts": "latest",
          react: "^18",
          "react-dom": "^18",
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
          "react-router-dom": "^5.3.0",
          "react-scripts": "latest",
          react: "^18",
          "react-dom": "^18",
          ...(example.extraDependencies || {})
        }}
        code={example.code}
      />
    )
  ) : (
    <Redirect to={`/${environment}/example/${data.examples[0].slug}`} />
  );
}

Example.propTypes = {
  data: PropTypes.object,
  match: PropTypes.shape({
    params: PropTypes.shape({
      example: PropTypes.string,
      environment: PropTypes.string
    })
  })
};
