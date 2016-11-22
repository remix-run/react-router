import React, { PropTypes } from 'react'
import createHashHistory from 'history/createHashHistory'
import Router from './Router'
import { addLeadingSlash, stripLeadingSlash } from 'history/PathUtils'

const createHref = hashType => path => {
  let newPath

  switch (hashType) {
    case 'hashbang':
      newPath = path.charAt(0) === '!' ? path : '!/' + stripLeadingSlash(path)
    break
    case 'noslash':
      newPath = stripLeadingSlash(path)
    break
    case 'slash':
    default:
      newPath = addLeadingSlash(path)
    break
  }

  return `#${newPath}`
}

class HashRouter extends React.Component {
  componentWillMount() {
    const {
      basename,
      getUserConfirmation,
      hashType
    } = this.props

    this.history = createHashHistory({
      basename,
      getUserConfirmation,
      hashType
    })
  }

  render() {
    const {
      basename, // eslint-disable-line
      getUserConfirmation, // eslint-disable-line
      hashType, // eslint-disable-line
      ...routerProps
    } = this.props

    return (
      <Router
        history={this.history}
        createHref={createHref(hashType)}
        {...routerProps}
      />
    )
  }
}

if (__DEV__) {
  HashRouter.propTypes = {
    basename: PropTypes.string,
    getUserConfirmation: PropTypes.func,
    hashType: PropTypes.string,

    // StaticRouter props
    stringifyQuery: PropTypes.func,
    parseQueryString: PropTypes.func,
    createHref: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }
}

export default HashRouter
