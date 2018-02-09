/*eslint react/no-danger:0 */
import React from "react";
import PropTypes from "prop-types";
import "prismjs/themes/prism-tomorrow.css";

const MarkdownViewer = ({ html, id }) => (
  <markdown
    dangerouslySetInnerHTML={{
      __html: html
    }}
  />
);

MarkdownViewer.propTypes = {
  html: PropTypes.string.isRequired
};

export default MarkdownViewer;
