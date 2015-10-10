import { Component } from 'react'

export default class Website extends Component {
  render() {
    return <div>website wrapper {this.props.children}</div>
  }
}
