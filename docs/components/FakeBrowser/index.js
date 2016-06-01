import React from 'react'
import { B, V, H, I, PAD, LIGHT_GRAY } from '../layout'
import createMemoryHistory from 'history/lib/createMemoryHistory'
import LeftArrow from 'react-icons/lib/ti/arrow-left'
import RightArrow from 'react-icons/lib/ti/arrow-right'
import { button } from './style.css'

const useCanGo = (history) => {
  let length = 0
  let cursor = 0

  const goBack = () => {
    cursor--
    history.goBack()
  }

  const goForward = () => {
    cursor++
    history.goForward()
  }

  const push = (...args) => {
    if (cursor === length) {
      length++
      cursor++
    } else {
      length = cursor
    }
    history.push(...args)
  }

  return {
    ...history,
    goBack,
    goForward,
    push,
    canGoBack: () => cursor > 0,
    canGoForward: () => length > cursor
  }
}

class FakeBrowser extends React.Component {

  state = { address: null }

  componentWillMount() {
    const history = this.history = useCanGo(createMemoryHistory())
    this.unlisten = history.listen((location) => {
      this.setState({ address: location.pathname })
    })
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { children:Child } = this.props
    const { address } = this.state
    const { history } = this
    return (
      <V
        background="white"
        boxShadow="0px 4px 10px hsla(0, 0%, 0%, 0.25)"
        height="80vh"
        border="1px solid #ccc"
      >
        <H
          background={LIGHT_GRAY}
          border="none"
          borderBottom="solid 1px #ccc"
          alignItems="center"
          padding={`0 ${PAD/2}px`}
        >
          <B
            component="button"
            className={button}
            fontSize="200%"
            props={{
              onClick: history.goBack,
              disabled: !history.canGoBack(),
              ariaLabel: 'Go back in fake browser'
            }}
          ><LeftArrow/></B>
          <B
            component="button"
            className={button}
            fontSize="200%"
            props={{
              onClick: history.goForward,
              disabled: !history.canGoForward(),
              ariaLabel: 'Go forward in fake browser'
            }}
          ><RightArrow/></B>
          <H
            flex="1"
            alignItems="center"
            padding={`${PAD/3}px`}
          >
            <B
              component="input"
              font="inherit"
              width="100%"
              props={{
                type: 'text',
                value: address,
                onChange: (e) => {
                  this.setState({
                    address: e.target.value
                  })
                },
                onKeyDown: (e) => {
                  if (e.key === 'Enter')
                    this.history.push(e.target.value)
                }
              }}
            />
          </H>
        </H>
        <B flex="1" padding={`${PAD}px`}>
          <Child history={history}/>
        </B>
      </V>
    )
  }
}

export default FakeBrowser
