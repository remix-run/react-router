import React, { Component, PropTypes } from 'react'
import EnvironmentLarge from './EnvironmentLarge'
import EnvironmentSmall from './EnvironmentSmall'
import Bundle from './Bundle'
import { Block } from 'jsxstyle'
import SmallScreen from './SmallScreen'
import Loading from './Loading'

const envData = {
  web: require('bundle?lazy!../docs/Web'),
  native: require('bundle?lazy!../docs/Native'),
  core: require('bundle?lazy!../docs/Core')
}

class Environment extends Component {
  static propTypes = {
    location: PropTypes.object,
    history: PropTypes.object,
    match: PropTypes.shape({
      params: PropTypes.shape({
        environment: PropTypes.string
      })
    })
  }

  componentDidMount() {
    this.preload()
  }

  preload() {
    Object.keys(envData).forEach(key => envData[key](() => {}))
  }

  render() {
    const { history, location, match, match: { params: { environment }}} = this.props
    return (
      <SmallScreen>
        {(isSmallScreen) => (
          <Bundle load={envData[environment]}>
            {(data) => data ? (
              isSmallScreen ? (
                <EnvironmentSmall
                  data={data}
                  match={match}
                  location={location}
                  history={history}
                />
              ) : (
                <EnvironmentLarge data={data} match={match}/>
              )
            ) : (
              <Loading/>
            )}
          </Bundle>
        )}
      </SmallScreen>
    )
  }
}

export default Environment

