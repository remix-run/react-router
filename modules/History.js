import { history } from './PropTypes';

var History = {

  contextTypes: { history },

  componentWillMount () {
    this.history = this.context.history;
  }

};

export default History;
