import React, { PropTypes } from 'react'
import StaticRouter from './StaticRouter'

class Router extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      location: props.history.location,
      action: props.history.action
    }
  }

  componentDidMount() {
    const { history } = this.props
    this.unlisten = history.listen(() => {
      this.setState({
        location: history.location,
        action: history.action
      })
    })
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { location, action } = this.state
    const { history, ...rest } = this.props
    return (
      <StaticRouter
        action={action}
        location={location}
        onPush={history.push}
        onReplace={history.replace}
        blockTransitions={history.block}
        {...rest}
      />
    )
  }
}

if (__DEV__) {
  Router.propTypes = {
    history: PropTypes.object.isRequired
  }
}

export default Router
