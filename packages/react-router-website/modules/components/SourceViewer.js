/*eslint-disable react/no-danger*/
import React from 'react'
import 'prismjs/themes/prism-tomorrow.css'
import { B } from './bricks'

const SourceViewer = ({ code, ...rest }) => (
  <B component="pre" {...rest} fontSize="12px">
    <code dangerouslySetInnerHTML={{ __html: code }} />
  </B>
)

SourceViewer.propTypes = {
  code: React.PropTypes.string.isRequired
}

export default SourceViewer
