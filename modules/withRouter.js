import hoistStatics from 'hoist-non-react-statics'
import { routerShape } from './PropTypes'

export default function withRouter(Component) {
  const WithRouter = class extends Component {}

  WithRouter.contextTypes = {
    router: routerShape
  }

  return hoistStatics(WithRouter, Component)
}
