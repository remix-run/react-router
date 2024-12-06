import React from 'react'

const RouterSubscriberContext = React.createContext()

export function ContextProvider(props) {
  const contextRef = React.useRef()
  if (!contextRef.current) {
    contextRef.current = {
      eventIndex: 0,
      listener: [],
      subscribe(listener) {
        contextRef.current.listeners.push(listener)
        return () => {
          contextRef.current.listeners = contextRef.current.listeners.filter(
            (item) => item !== listener
          )
        }
      }
    }
  }

  React.useEffect(() => {
    contextRef.current.eventIndex++
    contextRef.current.listeners.forEach((listener) =>
      listener(contextRef.current.eventIndex)
    )
  }, [])

  return (
    <RouterSubscriberContext.Provider value={contextRef.current}>
      {props.children}
    </RouterSubscriberContext.Provider>
  )
}

export function useContextSubscriber() {
  const context = React.useContext(RouterSubscriberContext)

  const [ lastRenderedEventIndex, setLastRenderedEventIndex ] = React.useState(
    () => {
      if (!context) {
        return undefined
      }
      return context.eventIndex
    }
  )

  React.useEffect(() => {
    if (!context) {
      return
    }

    const handleContextUpdate = (eventIndex) => {
      setLastRenderedEventIndex((currentLastRenderedEventIndex) => {
        if (eventIndex !== currentLastRenderedEventIndex) {
          return eventIndex
        } else {
          return currentLastRenderedEventIndex
        }
      })
    }
    const unsubscribe = context.subscribe(handleContextUpdate)
    return () => {
      unsubscribe()
    }
  }, [])

  React.useEffect(() => {
    if (!context) {
      return
    }

    setLastRenderedEventIndex(context.eventIndex)
  }, [ context ])

  return lastRenderedEventIndex
}
