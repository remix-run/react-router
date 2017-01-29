import React from 'react'
import { B, H, darkGray } from './bricks'
import LogoImage from '../logo.png'

const Logo = () => (
  <H
    background={darkGray}
    width="230px"
    height="230px"
    alignItems="center"
    borderRadius="50%"
    boxShadow="2px 10px 50px hsla(0, 0%, 0%, 0.35)"
  >
    <B position="relative" top="-8px" textAlign="center" width="100%">
      <img src={LogoImage} width="75%"/>
    </B>
  </H>
)

export default Logo
