import { Component, PropTypes } from 'react'

let delegate = (history) => {
  document.body.addEventListener('click', (e) => {
    let node = e.target
    while (node) {
      // document or svg has weird stuff
      if (typeof node.className === 'string') {
        if (node.className.match(/internal-link/)) {
          e.preventDefault()
          const href = node.getAttribute('href')
          console.log(href)
          history.push(href)
          break
        }
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

  static propTypes = {
    children: PropTypes.node
  }

  componentDidMount() {
    delegate(this.context.history)
  }

  render() {
    return this.props.children
  }
}

export default DelegateMarkdownLinks
