import React, { PropTypes } from 'react'
const BEFOREUNLOAD = "beforeunload"; // see: http://stackoverflow.com/questions/39094138/reactjs-event-listener-beforeunload-added-but-not-removed

/**
 * The public API for prompting the user before navigating away
 * from a screen with a component.
 */
class Prompt extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
      block: PropTypes.func.isRequired
    }).isRequired
  }

  static propTypes = {
    when: PropTypes.bool,
    message: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string
    ]).isRequired,
    beforeUnload: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.bool
    ])
  }

  static defaultProps = {
    when: true
  }

  enable(message) {
    if (this.unblock)
      this.unblock()

    this.unblock = this.context.router.block(message)
  }

  disable() {
    if (this.unblock) {
      this.unblock()
      this.unblock = null
    }
  }

  onbeforeunload(e) {
    var dialogText = "Changes you made may not be saved."
    e.returnValue = dialogText
    return dialogText
  }

  enableUnload(_onbeforeunload) {
    if(this._subscribed) { return }
    this._subscribed = _onbeforeunload ? _onbeforeunload : this.onbeforeunload;
    window.addEventListener(BEFOREUNLOAD, this._subscribed)
  }

  disableUnload() {
    window.removeEventListener(BEFOREUNLOAD, this._subscribed)
    delete this._subscribed
  }

  componentWillMount() {
    if (this.props.when)
      this.enable(this.props.message)
    if (this.props.beforeUnload)
      this.enableUnload();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.when) {
      if (!this.props.when || this.props.message !== nextProps.message)
        this.enable(nextProps.message)
    } else {
      this.disable()
    }

    if (nextProps.beforeUnload === true && this.props.beforeUnload === false) {
      this.enableUnload()
    } else if (nextProps.beforeUnload === false && 
      (this.props.beforeUnload === true || typeof this.props.beforeUnload === "function")) {
      this.disableUnload()
    }

    if (typeof nextProps.beforeUnload === "function") {
      this.enableUnload(nextProps.beforeUnload)
    }    
  }

  componentWillUnmount() {
    this.disable()
    this.disableUnload()
  }

  render() {
    return null
  }
}

export default Prompt
