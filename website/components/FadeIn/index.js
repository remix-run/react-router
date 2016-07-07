import React from 'react'
import { show, hide, transition } from './style.css'

class FadeIn extends React.Component {

  state = { show: false }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ show: true })
    }, 0)
  }

  render() {
    const child = React.Children.only(this.props.children)
    const className = child.props.className || '' + transition
    return React.cloneElement(child, {
      className: this.state.show ?
        show + ' ' + className :
        hide + ' ' + className
    })
  }
}

export default FadeIn
