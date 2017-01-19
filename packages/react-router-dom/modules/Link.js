import React, { PropTypes } from 'react'
import { resolveLocation } from 'react-router/resolve'

const isModifiedEvent = (event) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

/**
 * The public API for rendering a router-aware <a>.
 */
class Link extends React.Component {

  static contextTypes = {
    router: PropTypes.shape({
      push: PropTypes.func.isRequired,
      replace: PropTypes.func.isRequired,
      createHref: PropTypes.func.isRequired,
      match: PropTypes.shape({
        url: PropTypes.string
      })
    }).isRequired
  }

  static propTypes = {
    onClick: PropTypes.func,
    target: PropTypes.string,
    replace: PropTypes.bool,
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ])
  }

  static defaultProps = {
    replace: false
  }

  handleClick = (event) => {
    if (this.props.onClick)
      this.props.onClick(event)

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore right clicks
      !this.props.target && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault()

      const { router } = this.context
      const { replace } = this.props
      const to = this.absolutePathname()
      if (replace) {
        router.replace(to)
      } else {
        router.push(to)
      }
    }
  }

  absolutePathname() {
    const { router } = this.context
    const { to } = this.props
    const { match } = router
    const base = (match && match.url) ? match.url : ''
    return resolveLocation(to, base)
  }

  componentWillMount() {
    const { router } = this.context
    this.unlisten = router.listen(() => this.forceUpdate())
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { router } = this.context
    const { replace, to, ...props } = this.props // eslint-disable-line no-unused-vars
    const absoluteTo = this.absolutePathname()
    const href = router.createHref(
      typeof absoluteTo === 'string' ? { pathname: absoluteTo } : absoluteTo
    )

    return <a {...props} onClick={this.handleClick} href={href}/>
  }
}

export default Link
