import React from 'react'
import { Flex, Block as B } from 'jsxstyle'

const H = React.createClass({
  render() {
    return <Flex {...this.props} flexDirection="row"/>
  }
})

const V = React.createClass({
  render() {
    return <Flex {...this.props} flexDirection="column"/>
  }
})

const I = React.createClass({
  render() {
    return <B {...this.props} display="inline-block"/>
  }
})

export { B, I, H, V }

export const PAD = 20
export const GRAY = '#999'
export const LIGHT_GRAY = '#f5f5f5'
export const RED = 'hsl(5, 100%, 41%)'

