import { ComponentClass, FunctionComponent } from 'react'
import { InjectedRouter, Params } from './Router'
import { Location } from 'history'
import { PlainRoute } from './Route'

export interface WithRouterProps<P = Params, Q = any> {
    location: Location<Q>;
    params: P;
    router: InjectedRouter;
    routes: PlainRoute[];
}

type ComponentConstructor<P> = ComponentClass<P> | FunctionComponent<P>;

declare function withRouter<P, S>(
    component: ComponentConstructor<P & WithRouterProps> & S,
): ComponentClass<Omit<P, keyof WithRouterProps>> & S;
declare function withRouter<P>(
    component: ComponentConstructor<P & WithRouterProps>,
): ComponentClass<Omit<P, keyof WithRouterProps>>;

export default withRouter
