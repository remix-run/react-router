import { Requireable, Validator } from 'react'

export interface RouterShape extends Validator<any> {
    push: Requireable<any>;
    replace: Requireable<any>;
    go: Requireable<any>;
    goBack: Requireable<any>;
    goForward: Requireable<any>;
    setRouteLeaveHook: Requireable<any>;
    isActive: Requireable<any>;
}

export interface LocationShape extends Validator<any> {
    pathname: Requireable<any>;
    search: Requireable<any>;
    state: any;
    action: Requireable<any>;
    key: any;
}

export const routerShape: RouterShape
export const locationShape: LocationShape
