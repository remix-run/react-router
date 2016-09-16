import React from 'react'

export const PAD = 20
export const GRAY = '#999'
export const LIGHT_GRAY = '#f5f5f5'
export const RED = 'hsl(5, 100%, 41%)'


const STYLE_PROP_NAMES = {}
const styles = document.createElement('div').style
for (var key in styles)
  STYLE_PROP_NAMES[key] = true

const splitStyles = ({ style={}, ...combinedProps}) => {
  const props = {}
  Object.keys(combinedProps).forEach((key) => {
    if (STYLE_PROP_NAMES[key])
      style[key] = combinedProps[key]
    else
      props[key] = combinedProps[key]
  })
  return { style, ...props }
}

export class I extends React.Component {
  render() {
    return <B {...this.props} display="inline-block"/>
  }
}

export class B extends React.Component {
  static defaultProps = {
    component: 'div'
  }

  render() {
    const { component:Component, ...props } = this.props
    if (Component === 'img')
      console.log(splitStyles(props))
    return <Component {...splitStyles(props)} />
  }
}

export class Flex extends React.Component {
  render() {
    return <B {...this.props} display="flex" />
  }
}

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
