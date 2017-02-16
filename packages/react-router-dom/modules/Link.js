import React from 'react'
import PropTypes from 'prop-types'
import resolveLocation from './resolveLocation'

const isModifiedEvent = (event) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

/**
 * The public API for rendering a history-aware <a>.
 */
class Link extends React.Component {
  static propTypes = {
    onClick: PropTypes.func,
    target: PropTypes.string,
    replace: PropTypes.bool,
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]).isRequired
  }

  static defaultProps = {
    replace: false
  }

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired,
        createHref: PropTypes.func.isRequired
      }).isRequired,
      route: PropTypes.shape({
        match: PropTypes.shape({
          url: PropTypes.string
        })
      })
    }).isRequired
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

      const { history } = this.context.router
      const { replace } = this.props
      const to = this.getLocation()
      if (replace) {
        history.replace(to)
      } else {
        history.push(to)
      }
    }
  }

  getLocation() {
    const { to } = this.props
    const { match } = this.context.router.route
    const base = (match && match.url) ? match.url : ''
    return resolveLocation(to, base)
  }

  render() {
    const { replace, to:undefTo, ...props } = this.props // eslint-disable-line no-unused-vars
    const to = this.getLocation()
    const href = this.context.router.history.createHref(
      typeof to === 'string' ? { pathname: to } : to
    )

    return <a {...props} onClick={this.handleClick} href={href}/>
  }
}

export default Link
