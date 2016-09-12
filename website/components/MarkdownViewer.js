import React from 'react'
import 'prismjs/themes/prism.css'
import { B, PAD } from './bricks'

const MarkdownViewer = ({ html }) => (
  <markdown
    dangerouslySetInnerHTML={{
      __html: html
    }}
  />
)

export default MarkdownViewer
