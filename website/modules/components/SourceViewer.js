/*eslint-disable react/no-danger*/
import React from "react";
import PropTypes from "prop-types";
import "prismjs/themes/prism-tomorrow.css";
import { Block } from "jsxstyle";

export default function SourceViewer({ code, ...rest }) {
  return (
    <Block
      component="pre"
      background="rgb(45, 45, 45)"
      color="white"
      margin="0"
      overflow="auto"
      {...rest}
    >
      <code dangerouslySetInnerHTML={{ __html: code }} />
    </Block>
  );
}

SourceViewer.propTypes = {
  code: PropTypes.string.isRequired
};
