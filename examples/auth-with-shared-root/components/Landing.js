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

import React, { Component } from 'react'

class Landing extends Component {
  render() {
    return (
      <div>
        <h1>Landing Page</h1>
        <p>This page is only shown to unauthenticated users.</p>
        <p>Partial / Lazy loading. Open the network tab while you navigate. Notice that only the required components are downloaded as you navigate around.</p>
      </div>
    )
  }
}

module.exports = Landing
