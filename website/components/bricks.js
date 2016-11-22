import React, { PropTypes } from 'react'
import Flex from 'jsxstyle/Flex'
import B from 'jsxstyle/Block'
import I from 'jsxstyle/Inline'
import IB from 'jsxstyle/InlineBlock'

export const red = 'rgb(233, 73, 73)'
export const darkGray = 'rgb(45, 45, 45)'
export const lightGray = 'rgb(81, 81, 81)'

export const PAD = 20
export const GRAY = '#999'
export const LIGHT_GRAY = '#f5f5f5'
export const RED = 'hsl(5, 100%, 41%)'

export const bigFont = '250%'

export { B, I, IB }

export class H extends React.Component {
  render() {
    return <Flex {...this.props} flexDirection="row"/>
  }
}

export class V extends React.Component {
  render() {
    return <Flex {...this.props} flexDirection="column"/>
  }
}

export const VSpace = ({ height }) => (
  <B height={height}/>
)
VSpace.propTypes = { height: PropTypes.string }

export const HSpace = ({ width }) => (
  <I width={width}/>
)
HSpace.propTypes = { width: PropTypes.string }


