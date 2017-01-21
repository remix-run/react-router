import React, { PropTypes } from 'react'
import { Prompt } from 'react-router'

const BEFOREUNLOAD = "beforeunload";

var UnloadComponent = ComposedComponent => class extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
        history: PropTypes.shape({
            block: PropTypes.func.isRequired
        }).isRequired
    }).isRequired
  }

  static propTypes = {
    when: PropTypes.bool,
    message: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.string
    ]).isRequired,
    beforeUnload: PropTypes.bool
  }

  constructor(props) {
    super(props)
  }

  onbeforeunload(e) {
    var dialogText = "Changes you made may not be saved."
    e.returnValue = dialogText
    return dialogText
  }

  enableUnload(onbeforeunload) {
    if(this.subscribed) { return }
    this.subscribed = onbeforeunload ? onbeforeunload : this.onbeforeunload;
    window.addEventListener(BEFOREUNLOAD, this.subscribed)
  }

  disableUnload() {
    window.removeEventListener(BEFOREUNLOAD, this.subscribed)
    delete this.subscribed
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.beforeUnload === true && this.props.beforeUnload === false) {
      this.enableUnload()
    } else if (nextProps.beforeUnload === false && 
      (this.props.beforeUnload === true)) {
      this.disableUnload()
    }    
  }

  componentWillMount() {
    if (this.props.beforeUnload)
        this.enableUnload()        
  }

  componentWillUnmount() {
    this.disableUnload()
  }

  render() {
    return <ComposedComponent {...this.props} />
  }
}

let BrowserPrompt = UnloadComponent(Prompt)
export default BrowserPrompt