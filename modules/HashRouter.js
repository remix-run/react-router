import React, { PropTypes } from 'react'
import HashHistory from 'react-history/HashHistory'
import { addLeadingSlash, stripLeadingSlash } from 'history/PathUtils'
import StaticRouter from './StaticRouter'

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

/**
 * A router that uses the URL hash.
 */
const HashRouter = ({ basename, getUserConfirmation, hashType, ...props }) => (
  <HashHistory
    basename={basename}
    getUserConfirmation={getUserConfirmation}
    hashType={hashType}
  >
    {({ history, action, location }) => (
      <StaticRouter
        action={action}
        location={location}
        basename={basename}
        onPush={history.push}
        onReplace={history.replace}
        blockTransitions={history.block}
        createHref={createHref(hashType)}
        {...props}
      />
    )}
  </HashHistory>
)

if (__DEV__) {
  HashRouter.propTypes = {
    basename: PropTypes.string,
    getUserConfirmation: PropTypes.func,
    hashType: PropTypes.string,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }
}

export default HashRouter
