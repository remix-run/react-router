import warning from 'warning'
import { history } from './PropTypes'

/**
 * A mixin that adds the "history" instance variable to components.
 */
const History = {

  contextTypes: {
    history
  },

  componentWillMount() {
    warning(false, 'the `History` mixin is deprecated, please access `context.router` with your own `contextTypes` or see https://github.com/rackt/react-router/blob/v1.1.0/CHANGES.md#v110 for more options')
    this.history = this.context.history
  }

}

export default History
