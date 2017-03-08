import { Component, PropTypes } from 'react'
import { withRouter } from 'react-router-dom'

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

const DelegateMarkdownLinks = withRouter(class extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    children: PropTypes.node
  }

  componentDidMount() {
    delegate(this.props.history)
  }

  render() {
    return this.props.children
  }
})

export default DelegateMarkdownLinks
