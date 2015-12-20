import warning from 'warning'

export default function routerWarning(falseToWarn, message) {
  message = `[react-router] ${message}`
  warning(falseToWarn, message)
}
