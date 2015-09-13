import { history } from './PropTypes'

const History = {

  contextTypes: { history },

  componentWillMount () {
    this.history = this.context.history
  }

}

export default History
