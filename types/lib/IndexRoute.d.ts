import { FunctionComponent, ClassAttributes } from 'react'
import { LocationState } from 'history'
import {
  EnterHook,
  ChangeHook,
  LeaveHook,
  RouteComponent,
  RouteComponents,
  RouterState
} from '..'

type ComponentCallback = (err: any, component: RouteComponent) => any;
type ComponentsCallback = (err: any, components: RouteComponents) => any;

export interface IndexRouteProps<Props = any> {
  component?: RouteComponent | undefined;
  components?: RouteComponents | undefined;
  props?: Props | undefined;
  getComponent?(nextState: RouterState, callback: ComponentCallback): void;
  getComponents?(nextState: RouterState, callback: ComponentsCallback): void;
  onEnter?: EnterHook | undefined;
  onChange?: ChangeHook | undefined;
  onLeave?: LeaveHook | undefined;
}

type IndexRoute = FunctionComponent<IndexRouteProps>;
declare const IndexRoute: IndexRoute

export default IndexRoute
