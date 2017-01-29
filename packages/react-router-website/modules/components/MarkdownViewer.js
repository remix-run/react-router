/*eslint react/no-danger:0 */
import React from 'react'
import 'prismjs/themes/prism-tomorrow.css'

const MarkdownViewer = ({ html }) => (
  <markdown
    dangerouslySetInnerHTML={{
      __html: html
    }}
  />
)

MarkdownViewer.propTypes = {
  html: React.PropTypes.string.isRequired
}

export default MarkdownViewer
