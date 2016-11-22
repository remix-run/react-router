import React from 'react'
import Logo from './Logo'
import { B, H, I, PAD, VSpace, HSpace, lightGray, red, bigFont } from './bricks'

const NavLink = (props) => (
  <B margin={`0 ${PAD/2}px`} cursor="pointer" {...props}/>
)

const Button = (props) => (
  <B padding={`15px 25px`} textTransform="uppercase" cursor="pointer" fontSize="10px" fontWeight="bold" userSelect="none" background="white" borderRadius="100px" boxShadow="0 10px 30px rgba(0,0,0,.25)" hoverBoxShadow="0 10px 25px rgba(0,0,0,.25)" activeBoxShadow="2px 2px 4px rgba(0,0,0,.25)" position="relative" top="0" hoverTop="1px" activeTop="5px" {...props}/>
)

const NavBar = () => (
  <H textTransform="uppercase" fontWeight="bold" width="100%">
    <B flex="1" fontSize="14px">
      <I component="a" href="https://reacttraining.com">
        React Training
      </I>
      <I> / </I>
      <I component="a" href="https://github.com/ReactTraining/react-router" color={lightGray}>
        React Router
      </I>
    </B>
    <H fontSize="12px">
      <NavLink>Examples</NavLink>
      <NavLink>API</NavLink>
      <NavLink>NPM</NavLink>
      <NavLink>Github</NavLink>
    </H>
  </H>
)

const Header = () => (
  <B background="linear-gradient(125deg,#fff,#f3f3f3 41%,#ededed 0,#fff)">
    <B padding={`${PAD}px`} maxWidth="1000px" margin="auto">
      <NavBar/>
      <VSpace height={`${PAD*2}px`}/>
      <H width="100%">
        <B flex="1">
          <Logo />
        </B>
        <B flex="1">
          <B component="h2" textTransform="uppercase" fontSize={bigFont} fontWeight="bold">
            Declarative Routing
          </B>
          <B textTransform="uppercase" fontSize="25px" fontWeight="bold">
            For React Applications
          </B>

          <VSpace height={PAD+'px'}/>
          <B>
            Components are the heart of React's powerful, declarative
            programming model. React Router is a collection of <b>navigational
            components</b> that compose naturally with your application. Whether
            you want to have <b>bookmarkable URLs</b> for your web app or a composable
            way to navigate in <b>React Native</b>, React Router works wherever React
            is rendering.
          </B>
          <VSpace height={PAD+'px'}/>
          <H>
            <Button>Live Examples</Button>
            <HSpace width={PAD+'px'}/>
            <Button>API Documentation</Button>
          </H>
        </B>
      </H>
      <VSpace height={`${PAD}px`}/>
    </B>
  </B>
)

export default Header
