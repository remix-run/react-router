const createServerRenderContext = () => {
  let flushed = false
  let flushedIndex = 0
  let redirect = null
  let matchContexts = [
    /* { hasMissComponent: bool, hasMatches: bool } */
  ]

  const setRedirect = (location) => {
    if (!redirect)
      redirect = location
  }

  // on the second pass, index is determined by render order
  const registerMatchProvider = () => {
    return flushed ? flushedIndex++ : (
      matchContexts.push({
        hasMissComponent: false,
        hasMatches: false
      }) - 1
    )
  }

  // We need to know there is a potential to miss, if there are no Miss
  // components under a Match, then we need to not worry about it
  const registerMissPresence = (index) => {
    matchContexts[index].hasMissComponent = true
  }

  const getResult = () => {
    flushed = true
    const missed = matchContexts.some((context) => {
      return context.hasMissComponent && !context.hasMatches
    })

    return {
      redirect,
      missed
    }
  }

  const missedAtIndex = (index) => {
    const context = matchContexts[index]
    // only return true once we have flushed to prevent accidental
    // render on first pass
    return flushed && !context.hasMatches && context.hasMissComponent
  }

  const updateMatchStatus = (index, matches) => {
    const context = matchContexts[index]
    // only need one Match to match
    context.hasMatches = context.hasMatches || matches
  }

  return {
    setRedirect,
    registerMatchProvider,
    registerMissPresence,
    getResult,
    updateMatchStatus,
    missedAtIndex
  }
}

export default createServerRenderContext
