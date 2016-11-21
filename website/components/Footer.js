import React from 'react'
import { B, I, PAD, darkGray, lightGray } from './bricks'

const FooterLink = ({ href, ...rest }) => (
  <I component="a" href={href} {...rest} textDecoration="underline"/>
)

FooterLink.propTypes = { href: React.PropTypes.string }

const Michael = () => (
  <FooterLink href="https://twitter.com/mjackson">Michael Jackson</FooterLink>
)

const Ryan = () => (
  <FooterLink href="https://twitter.com/mjackson">Ryan Florence</FooterLink>
)

const Contributors = () => (
  <FooterLink href="https://github.com/ReactTraining/react-router/graphs/contributors">
    contributors
  </FooterLink>
)

const CC = () => (
  <FooterLink href="https://creativecommons.org/licenses/by/4.0/">CC 4.0</FooterLink>
)

const ReactTraining = () => (
  <FooterLink href="https://reacttraining.com">React Training</FooterLink>
)

const year = new Date().getFullYear()

const Footer = () => (
  <B background={darkGray} color="white" padding={PAD*2+'px'} textAlign="center">
    <B component="p">
      React Router is primarily sponsored by <ReactTraining/>.<br/>
      It’s created and maintained by <Michael/>, <Ryan/>, and hundreds of <Contributors/>.
    </B>
    <B marginTop={PAD+'px'} color={lightGray}>&copy; {year} React Training</B>
    <B color={lightGray}>Code examples and documentation <CC/></B>
  </B>
)

export default Footer
