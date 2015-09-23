import createPropTypes from './PropTypes'

export default function createHistory(React) {
  const { history } = createPropTypes(React)

  const History = {

    contextTypes: { history },

    componentWillMount () {
      this.history = this.context.history
    }

  }

  return History

}
