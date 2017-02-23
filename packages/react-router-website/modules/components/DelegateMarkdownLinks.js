import React, { Component, PropTypes } from 'react'

let delegate = (history) => {
  document.body.addEventListener('click', (e) => {
    let node = e.target
    let link = null
    while (node && node.className && typeof node.className === 'string') {
      if (node.className.match(/internal-link/)) {
        e.preventDefault()
        const href = node.getAttribute('href')
        history.push(href)
        break;
      }
      node = node.parentNode
    }
  })
  delegate = () => {}
}

class DelegateMarkdownLinks extends Component {

  static contextTypes = {
    history: PropTypes.object
  }

  componentDidMount() {
    delegate(this.context.history)
  }

  render() {
    return this.props.children
  }
}

export default DelegateMarkdownLinks
