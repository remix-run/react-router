import React from 'react'
import 'prismjs/themes/prism.css'
import { B, PAD } from './layout'

const MarkdownViewer = ({ html }) => (
  <B overflow="auto">
    <div
      dangerouslySetInnerHTML={{
        __html: html
      }}
    />
  </B>
)

export default MarkdownViewer
