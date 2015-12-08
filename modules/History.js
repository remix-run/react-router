import { history } from './PropTypes'

/**
 * A mixin that adds the "history" instance variable to components.
 */
const History = {

  contextTypes: {
    history
  },

  componentWillMount() {
    this.history = this.context.history
  }

}

export default History
