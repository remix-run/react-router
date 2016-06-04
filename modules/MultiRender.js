import React, { PropTypes } from 'react'

class MultiRender extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    render: PropTypes.func,
    component: PropTypes.func,
    props: PropTypes.object
  }

  render() {
    const { props, children, render, component:Component } = this.props

    return Component ? (
      <Component {...props}/>
    ) : render ? (
      render(props)
    ) : React.Children.count(children) === 1 ? (
      children
    ) : (
      <div>{children}</div>
    )
  }
}

export default MultiRender
