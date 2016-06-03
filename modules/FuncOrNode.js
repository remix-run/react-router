import React, { PropTypes } from 'react'
import { funcOrNode } from './PropTypes'

class FuncOrNode extends React.Component {
  static propTypes = {
    children: funcOrNode,
    props: PropTypes.object
  }

  render() {
    const { props, children } = this.props

    let Child
    if (typeof children === 'function')
      Child = children

    return Child ? (
      <Child {...props}/>
    ) : React.Children.count(children) === 1 ? (
      children
    ) : (
      <div>{children}</div>
    )
  }
}

export default FuncOrNode
