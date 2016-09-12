import React from 'react'
import 'prismjs/themes/prism.css'
import { B, PAD } from './bricks'

class SourceViewer extends React.Component {

  render() {
    return (
      <B component="pre" flex="1" overflow="auto" paddingRight={`${PAD}px`}>
        <code
          dangerouslySetInnerHTML={{
            __html: this.props.code
          }}
        />
      </B>
    )
  }

}

export default SourceViewer
