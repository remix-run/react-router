import React, { PropTypes } from 'react'
import { Block, Row, Inline, Col } from 'jsxstyle'
import { Link, Route } from 'react-router-dom'
import { LIGHT_GRAY, RED } from '../Theme'
import Logo from './Logo'

const Tab = ({ to, ...rest }) => (
  <Route path={to} children={({ match }) => (
    <Block
      component={Link}
      props={{ to }}
      flex="1"
      textAlign="center"
      textTransform="uppercase"
      fontWeight="bold"
      fontSize="90%"
      padding="5px"
      background={match ? RED : 'white'}
      color={match ? 'white' : ''}
      {...rest}
    />
  )}/>
)

Tab.propTypes = { to: PropTypes.string }

const Tabs = () => (
  <Row
    boxShadow="0px 1px 1px hsla(0, 0%, 0%, 0.15)"
    margin="10px"
  >
    <Tab
      to="/web"
      borderTopLeftRadius="3px"
      borderBottomLeftRadius="3px"
    >Web</Tab>
    <Tab
      to="/native"
      marginLeft="-1px"
    >Native</Tab>
    <Tab
      to="/core"
      marginLeft="-1px"
      borderTopRightRadius="3px"
      borderBottomRightRadius="3px"
    >Core</Tab>
  </Row>
)

const Branding = () => (
  <Col alignItems="center" padding="15px 0">
    <Logo size={36} shadow={false}/>
    <Block
      marginTop="10px"
      flex="1"
      textTransform="uppercase"
      fontWeight="bold"
      fontSize="90%"
    >
      <Inline component="a" props={{ href:"https://reacttraining.com" }}>
        React Training
      </Inline>
      <Inline> / </Inline>
      <Inline
        component="a"
        props={{ href: 'https://github.com/ReactTraining/react-router' }}
        color={LIGHT_GRAY}
      >React Router</Inline>
    </Block>
  </Col>
)

const EnvironmentHeader = () => (
  <Block>
    <Branding/>
    <Tabs/>
  </Block>
)

export default EnvironmentHeader
