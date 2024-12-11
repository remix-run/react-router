import { FunctionComponent, ComponentType } from 'react'
import { InjectedRouter, Params } from './Router'
import { Location } from 'history'
import { PlainRoute } from './Route'

export interface WithRouterProps<P = Params, Q = any> {
  location: Location<Q>;
  params: P;
  router: InjectedRouter;
  routes: PlainRoute[];
}

declare function withRouter<P, S>(
  component: ComponentType<P & WithRouterProps> & S
): FunctionComponent<Omit<P, keyof WithRouterProps>> & S;
declare function withRouter<P>(
  component: ComponentType<P & WithRouterProps>
): FunctionComponent<Omit<P, keyof WithRouterProps>>;

export default withRouter
