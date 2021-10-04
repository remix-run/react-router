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
import { string, object } from 'prop-types'
import warning from './routerWarning'
import invariant from 'invariant'
import Redirect from './Redirect'
import { falsy } from './InternalPropTypes'

/**
 * An <IndexRedirect> is used to redirect from an indexRoute.
 */
/* eslint-disable react/require-render-return */
class IndexRedirect extends Component {
  static displayName = 'IndexRedirect'

  static createRouteFromReactElement(element, parentRoute) {
    /* istanbul ignore else: quick check */
    if (parentRoute) {
      parentRoute.indexRoute = Redirect.createRouteFromReactElement(element)
    } else {
      warning(
        false,
        'An <IndexRedirect> does not make sense at the root of your route config'
      )
    }
  }

  static propTypes = {
    to: string.isRequired,
    query: object,
    state: object,
    onEnter: falsy,
    children: falsy
  }

  render() {
    invariant(
      false,
      '<IndexRedirect> elements are for router configuration only and should not be rendered'
    )
  }
}

export default IndexRedirect
