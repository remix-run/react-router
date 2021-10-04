/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

import { Component } from 'react'
import { string, func } from 'prop-types'
import invariant from 'invariant'
import { createRouteFromReactElement } from './RouteUtils'
import { component, components } from './InternalPropTypes'

/**
 * A <Route> is used to declare which components are rendered to the
 * page when the URL matches a given pattern.
 *
 * Routes are arranged in a nested tree structure. When a new URL is
 * requested, the tree is searched depth-first to find a route whose
 * path matches the URL.  When one is found, all routes in the tree
 * that lead to it are considered "active" and their components are
 * rendered into the DOM, nested in the same order as in the tree.
 */
/* eslint-disable react/require-render-return */
class Route extends Component {
  static displayName = 'Route'

  static createRouteFromReactElement = createRouteFromReactElement

  static propTypes = {
    path: string,
    component,
    components,
    getComponent: func,
    getComponents: func
  }

  /* istanbul ignore next: quick check */
  render() {
    invariant(
      false,
      '<Route> elements are for router configuration only and should not be rendered'
    )
  }
}

export default Route
