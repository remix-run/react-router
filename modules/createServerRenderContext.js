const k = () => {}

const createServerRenderContext = () => {
  let flushed = false
  let redirect = null
  let matchContexts = [
    /* { hasMissComponent: bool, matchesByIdentity: [] } */
  ]

  const setRedirect = flushed ? k : (location) => {
    if (!redirect)
      redirect = location
  }

  const registerMatchContext = flushed ? k : (matchesByIdentity) => {
    return matchContexts.push({
      hasMissComponent: false,
      matchesByIdentity
    }) - 1
  }

  // We need to know there is a potential to miss, if there are no Miss
  // components under a Match, then we need to not worry about it
  const registerMissPresence = flushed ? k : (index) => {
    matchContexts[index].hasMissComponent = true
  }

  const getResult = () => {
    flushed = true
    const missed = matchContexts.some((context, index) => {
      return missedAtIndex(index)
    })

    return {
      redirect,
      missed
    }
  }

  const missedAtIndex = (index) => {
    const context = matchContexts[index]
    return (
      context.matchesByIdentity.length === 0 &&
      context.hasMissComponent
    )
  }

  return {
    setRedirect,
    registerMatchContext,
    registerMissPresence,
    getResult,
    missedAtIndex
  }
}

export default createServerRenderContext
