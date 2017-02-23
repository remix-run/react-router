/*eslint-disable react/no-danger*/
import React from 'react'
import 'prismjs/themes/prism-tomorrow.css'
import { Block } from 'jsxstyle'

const SourceViewer = ({ code, ...rest }) => (
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
)

SourceViewer.propTypes = {
  code: React.PropTypes.string.isRequired
}

export default SourceViewer
