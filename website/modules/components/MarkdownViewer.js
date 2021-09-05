import React from "react";
import PropTypes from "prop-types";
import "prismjs/themes/prism-tomorrow.css";

export default function MarkdownViewer({ html, id }) {
  return (
    <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

MarkdownViewer.propTypes = {
  html: PropTypes.string.isRequired
};
