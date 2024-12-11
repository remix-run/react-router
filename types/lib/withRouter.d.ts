import { ComponentClass, FunctionComponent } from 'react'
import { InjectedRouter, Params } from './Router'
import { Location } from 'history'
import { PlainRoute } from './Route'

interface Options {
    withRef?: boolean | undefined;
}

export interface WithRouterProps<P = Params, Q = any> {
    location: Location<Q>;
    params: P;
    router: InjectedRouter;
    routes: PlainRoute[];
}

type ComponentConstructor<P> = ComponentClass<P> | FunctionComponent<P>;

declare function withRouter<P, S>(
    component: ComponentConstructor<P & WithRouterProps> & S,
    options?: Options
): ComponentClass<Omit<P, keyof WithRouterProps>> & S;
declare function withRouter<P>(
    component: ComponentConstructor<P & WithRouterProps>,
    options?: Options
): ComponentClass<Omit<P, keyof WithRouterProps>>;

export default withRouter
