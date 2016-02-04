import warning from 'warning'

export default function routerWarning(falseToWarn, message, ...args) {
  message = `[react-router] ${message}`
  warning(falseToWarn, message, ...args)
}
