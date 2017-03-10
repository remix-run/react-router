import React, { PropTypes, Component } from 'react'
import { Block, Row, Flex } from 'jsxstyle'
import { DARK_GRAY, RED } from '../Theme'
import SmallScreen from './SmallScreen'

const Button = ({ children, ...props }) => (
  <Block
    component="button"
    color="#fff"
    padding="15px 10px"
    background={RED}
    borderRadius={0}
    cursor="pointer"
    border="none"
    textShadow="none"
    minWidth="80px"
    children={children}
    {...props}
  />
)

const Input = ({ margin, ...props}) => (
  <Block
    component="input"
    component="input"
    padding="10px 8px"
    border="1px solid #d6d6d6"
    borderRadius="0"
    backgroundColor="white"
    height="42px"
    flex="1"
    props={props}
    margin={margin}
  />
)

export default class NewsletterSignup extends Component {
  static propTypes = {
    tags: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
  }

  static defaultProps = {
    tags: '125835',
    id: '129214',
  }

  state = {
    submitted: false,
    name: '',
    email: '',
  }

  getReqURI = () => {
   const info = {
      id: this.props.id,
      api_key: '0DZDEQZjU_laOYXzD6cQRA',
      name: this.state.name.trim(),
      email: this.state.email.trim(),
      tags: this.props.tags,
    }

    return Object.keys(info).reduce((prev, next, index) => {
      const and = index === 0 ? '' : '&'
      return prev + and + next + '=' + info[next]
    }, '')
  }

  handleSubmit = (e) => {
    e.preventDefault()
    window.location.href='https://reacttraining.com/online/react-router'
    /*if (this.state.email) {
      const request = new XMLHttpRequest()
      request.open('POST', `//api.convertkit.com/v3/forms/129214/subscribe?${this.getReqURI()}`, true)
      request.onload = () => {
        if (request.status >= 200 && request.status < 400) {
          this.setState({
            email: '',
            name: '',
            submitted: true
          })
        }
      }
      request.send()*/
    }
  }

  render () {
    const { submitted, name, email } = this.state
    return (
      <SmallScreen>
        {(isSmallScreen) => (
          <Block
            background="white"
            maxWidth="700px"
            margin="auto"
            padding={isSmallScreen ? '40px' : '80px'}
          >
            <Block
              margin="auto"
              paddingBottom={isSmallScreen ? '20px' : '40px'}
              textAlign="center"
              fontSize={isSmallScreen ? '100%' : '150%'}
              fontWeight="bold"
            >
      {/*Sign up to receive updates about React Router, our workshops,
              online courses, and more:*/}
              As a companion to the documentation, we'll be launching a free course on React Router v4 within the next few weeks.
            </Block>
            <form onSubmit={this.handleSubmit}>
              {submitted ? (
                <Block color='white' textAlign='center'>
                  Thank you for signing up :)
                </Block>
              ) : (
                <Flex
                  flexDirection={isSmallScreen ? 'column' : 'row'}
                  justifyContent="space-around"
                >
                {/*<Input
                    value={name}
                    onChange={(e) => this.setState({ name: e.target.value })}
                    type="text"
                    name="name"
                    placeholder="FIRST NAME"
                    margin={isSmallScreen ? '5px 0' : '0 5px'}
                  />
                  <Input
                    value={email}
                    onChange={(e) => this.setState({ email: e.target.value })}
                    type="email"
                    name="email"
                    placeholder="EMAIL ADDRESS"
                    margin={isSmallScreen ? '0 0 5px 0' : '0 5px 0 0'}
                  /> */}
                  <Button type="submit">
                    {/*Subscribe*/}
                    More Information
                  </Button>
                </Flex>
              )}
            </form>
          </Block>
        )}
      </SmallScreen>
    )
  }
}
