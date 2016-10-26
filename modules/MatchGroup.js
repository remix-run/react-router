import React, { PropTypes, Children } from 'react'
import matchPattern from './matchPattern'
import Miss from './Miss'
import { LocationSubscriber } from './Broadcasts'

class MatchGroup extends React.Component {
  static contextTypes = {
    match: PropTypes.object
  }

  findMatch(location) {
    let matchedIndex
    let missIndex

    const { children } = this.props
    const { match:matchContext } = this.context
    const parent = matchContext && matchContext.parent

    Children.forEach(children, (child, index) => {
      if (matchedIndex) {
        return
      } else if (child.type === Miss) {
        missIndex = index
      } else {
        const { pattern, exactly:matchExactly } = child.props
        if (matchPattern(pattern, location, matchExactly, parent)) {
          matchedIndex = index
        }
      }
    })

    return { matchedIndex, missIndex }
  }

  render() {
    const { children } = this.props

    return (
      <LocationSubscriber>
        {(location) => {
          const { matchedIndex, missIndex } = this.findMatch(location)
          return matchedIndex != null ? (
            children[matchedIndex]
          ) : missIndex ? (
            children[missIndex]
          ) : null
        }}
      </LocationSubscriber>
    )
  }
}

if (__DEV__) {
  MatchGroup.propTypes = {
    children: PropTypes.node.isRequired
  }
}

export default MatchGroup
