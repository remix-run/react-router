import warning from './warning'
import { history } from './PropTypes'

/**
 * A mixin that adds the "history" instance variable to components.
 */
const History = {

  contextTypes: {
    history
  },

  componentWillMount() {
    warning(false, 'the `History` mixin is deprecated, please access `context.router` with your own `contextTypes`. http://tiny.cc/router-historymixin')
    this.history = this.context.history
  }

}

export default History
