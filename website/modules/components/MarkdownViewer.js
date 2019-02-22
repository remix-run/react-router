/*eslint-disable react/no-danger*/
import React from "react";
import PropTypes from "prop-types";
import "prismjs/themes/prism-tomorrow.css";

function MarkdownViewer({ html, id }) {
  return (
    <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

MarkdownViewer.propTypes = {
  html: PropTypes.string.isRequired
};

export default MarkdownViewer;
