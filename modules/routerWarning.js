import warning from 'warning'

let warned = {}

export default function routerWarning(falseToWarn, message, ...args) {
  // Only issue deprecation warnings once.
  if (message.indexOf('deprecated') !== -1) {
    if (warned[message]) {
      return
    }

    warned[message] = true
  }

  message = `[react-router] ${message}`
  warning(falseToWarn, message, ...args)
}

export function _resetWarned() {
  warned = {}
}
