import React, { PropTypes } from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { B, V, H, PAD, LIGHT_GRAY, GRAY } from '../bricks'
import { button } from './style.css'

const LeftArrowIcon = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 40 40" preserveAspectRatio="xMidYMid meet">
    <path d="m28.3 18.3h-12.6l3.8-3.8c0.7-0.6 0.7-1.7 0-2.3s-1.7-0.7-2.3 0l-7.9 7.8 7.9 7.8c0.3 0.4 0.7 0.5 1.1 0.5s0.9-0.1 1.2-0.5c0.7-0.6 0.7-1.7 0-2.3l-3.8-3.8h12.6c1 0 1.7-0.8 1.7-1.7s-0.8-1.7-1.7-1.7z"></path>
  </svg>
)

const RightArrowIcon = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 40 40" preserveAspectRatio="xMidYMid meet">
    <path d="m22.2 12.2c-0.7 0.6-0.7 1.7 0 2.3l3.8 3.8h-12.7c-0.9 0-1.6 0.8-1.6 1.7s0.7 1.7 1.6 1.7h12.7l-3.8 3.8c-0.7 0.6-0.7 1.7 0 2.3 0.3 0.4 0.7 0.5 1.1 0.5s0.9-0.1 1.2-0.5l7.9-7.8-7.9-7.8c-0.6-0.7-1.7-0.7-2.3 0z"></path>
  </svg>
)

const FileCodeIcon = () => (
  <svg
    fill="currentColor"
    height="1em"
    width="1em"
    viewBox="0 0 40 40"
    preserveAspectRatio="xMidYMid meet"
    style={{ verticalAlign: 'middle' }}
  >
    <path d="m16.3 15l-6.3 6.3 6.3 6.2 2.5-2.5-3.8-3.7 3.8-3.8-2.5-2.5z m5 2.5l3.7 3.8-3.7 3.7 2.5 2.5 6.2-6.2-6.2-6.3-2.5 2.5z m6.2-15h-22.5v35h30v-27.5l-7.5-7.5z m5 32.5h-25v-30h17.5l7.5 7.5v22.5z"/>
  </svg>
)

const Button = ({ children, ...props }) => (
  <B
    component="button"
    className={button}
    display="inline-block"
    border="none"
    margin="0"
    padding="0"
    background="none"
    fontSize="200%"
    marginTop="-3px"
    props={props}
    children={children}
  />
)

const getUserConfirmation = (message, callback) =>
  callback(window.confirm(message))

const createPath = (location) =>
  location.pathname + location.search

class FakeBrowser extends React.Component {
  state = {
    url: null
  }

  render() {
    const { url } = this.state
    const { children, ...props } = this.props

    return (
      <MemoryRouter getUserConfirmation={getUserConfirmation}>
        <Route render={({ canGo, goBack, goForward, push, location }) => (
          <V
            className="fake-browser"
            background="white"
            boxShadow="0px 5px 20px hsla(0, 0%, 0%, 0.75)"
            borderRadius="6px"
            {...props}
          >
            <H
              background={LIGHT_GRAY}
              borderTopLeftRadius="6px"
              borderTopRightRadius="6px"
              border="none"
              alignItems="center"
              borderBottom="solid 1px #ccc"
              padding={`0 ${PAD / 2}px`}
            >
              <Button onClick={goBack} disabled={!canGo(-1)}>
                <LeftArrowIcon height="1em" width="1em" style={{ verticalAlign: 'middle', marginTop: -3 }}/>
              </Button>
              <Button onClick={goForward} disabled={!canGo(1)}>
                <RightArrowIcon height="1em" width="1em" style={{ verticalAlign: 'middle', marginTop: -3 }}/>
              </Button>
              <B
                position="relative"
                zIndex="1"
                left={`${PAD / 2.5}px`}
                top="-2px"
                color={GRAY}
              >
                <FileCodeIcon/>
              </B>
              <H
                flex="1"
                alignItems="center"
                padding={`${PAD / 3}px`}
                marginLeft={`-${PAD}px`}
              >
                <B
                  component="input"
                  font="inherit"
                  width="100%"
                  paddingLeft={`${PAD * 1.25}px`}
                  color={GRAY}
                  type="text"
                  props={{
                    value: url ? url : createPath(location),
                    onChange: (e) => {
                      this.setState({ url: e.target.value })
                    },
                    onBlur: (e) => {
                      this.setState({ url: null})
                    },
                    onKeyDown: (e) => {
                      if (e.key === 'Enter') {
                        this.setState({ url: null })
                        push(e.target.value)
                      }
                    }
                  }}
                />
              </H>
            </H>
            <B
              flex="1"
              padding={`${PAD}px`}
              overflow="auto"
              position="relative"
            >
              {React.Children.only(children)}
            </B>
          </V>
        )}/>
      </MemoryRouter>
    )
  }
}

export default FakeBrowser
