import React from 'react'
import hljs from 'highlight.js'

class SourceViewer extends React.Component {
  state = { html: null }

  componentWillMount() {
    const { value } = hljs.highlightAuto(this.props.code)
    this.setState({ html: value })
  }

  render() {
    return <pre><code dangerouslySetInnerHTML={{ __html: this.state.html }}/></pre>
  }
}

export default SourceViewer
