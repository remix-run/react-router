import React from 'react'
import createMemoryHistory from 'history/lib/createMemoryHistory'
import LeftArrowIcon from 'react-icons/lib/ti/arrow-left'
import RightArrowIcon from 'react-icons/lib/ti/arrow-right'
import FileCodeIcon from 'react-icons/lib/go/file-code'
import { B, V, H, PAD, LIGHT_GRAY, GRAY } from '../layout'
import { button } from './style.css'

////////////////////////////////////////////////////////////////////////////////
const createFakeBrowserHistory = (createHistory) => {
  const getUserConfirmation = (message, callback) => {
    callback(window.confirm(message))
  }

  const history = createHistory({ getUserConfirmation })

  if (!history.canGo) {
    console.error('need to make a PR to createMemoryHistory to expose `canGo`, but you can monkey patch node_modules for now') // eslint-disable-line
    history.canGo = () => true
  }

  return history
}


////////////////////////////////////////////////////////////////////////////////
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


////////////////////////////////////////////////////////////////////////////////
class FakeBrowser extends React.Component {

  state = {
    address: null
  }

  componentWillMount() {
    const history = this.history = createFakeBrowserHistory(createMemoryHistory)
    this.setState({ address: history.getCurrentLocation().pathname })
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
        border="1px solid #ccc"
        flex="1"
      >
        <H
          background={LIGHT_GRAY}
          border="none"
          borderBottom="solid 1px #ccc"
          alignItems="center"
          padding={`0 ${PAD/2}px`}
        >
          <Button
            onClick={history.goBack}
            disabled={!history.canGo(-1)}
            ariaLabel="Go back in fake browser"
          ><LeftArrowIcon/></Button>
          <Button
            onClick={history.goForward}
            disabled={!history.canGo(1)}
            ariaLabel="Go forward in fake browser"
          ><RightArrowIcon/></Button>
          <B
            position="relative"
            zIndex="1"
            left={`${PAD/2.5}px`}
            top="-2px"
            color={GRAY}
          >
            <FileCodeIcon/>
          </B>
          <H
            flex="1"
            alignItems="center"
            padding={`${PAD/3}px`}
            marginLeft={`-${PAD}px`}
          >
            <B
              component="input"
              font="inherit"
              width="100%"
              paddingLeft={`${PAD*1.25}px`}
              color={GRAY}
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
                    history.push(e.target.value)
                }
              }}
            />
          </H>
        </H>
        <B flex="1" padding={`${PAD}px`} overflow="auto" position="relative">
          <Child history={history}/>
        </B>
      </V>
    )
  }
}


////////////////////////////////////////////////////////////////////////////////
export default FakeBrowser
