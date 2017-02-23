const HorizontalPanHandlers = (anim, config = {}) => {
  return {
    onTouchStart: (event) => {
      anim.stopAnimation(startValue => {
        config.onStart && config.onStart()
        const startPosition = event.touches[0].clientX
        let lastTime = Date.now()
        let lastPosition = event.touches[0].clientX
        let velocity = 0

        const updateVelocity = (event) => {
          const now = Date.now()
          if (event.touches[0].clientX === lastPosition || now === lastTime) {
            return
          }
          velocity = (event.touches[0].clientX - lastPosition) / (now - lastTime)
          lastTime = now
          lastPosition = event.touches[0].clientX
        }

        let moveListener, upListener
        window.addEventListener('touchmove', moveListener = (event) => {
          console.log(event)
          const value = startValue + (event.touches[0].clientX - startPosition)
          anim.setValue(value)
          updateVelocity(event.touches[0])
        })
        window.addEventListener('touchend', upListener = (event) => {
          updateVelocity(event.touches[0])
          window.removeEventListener('touchmove', moveListener)
          window.removeEventListener('touchend', upListener)
          config.onEnd && config.onEnd({ velocity })
        })
      })
    }
  }
}

export default HorizontalPanHandlers
