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
import { Link } from '@americanexpress/one-app-router'

const styles = {}

styles.nav = {
  borderBottom: '1px solid #aaa'
}

styles.link = {
  display: 'inline-block',
  padding: 10,
  textDecoration: 'none'
}

styles.activeLink = {
  ...styles.link,
  color: 'red'
}

class Nav extends Component {
  render() {
    const { course } = this.props
    const pages = [
      [ 'announcements', 'Announcements' ],
      [ 'assignments', 'Assignments' ],
      [ 'grades', 'Grades' ]
    ]

    return (
      <nav style={styles.nav}>
        {pages.map((page, index) => (
          <Link
            key={page[0]}
            activeStyle={index === 0 ? { ...styles.activeLink, paddingLeft: 0 } : styles.activeLink}
            style={index === 0 ? { ...styles.link, paddingLeft: 0 } : styles.link}
            to={`/course/${course.id}/${page[0]}`}
          >{page[1]}</Link>
        ))}
      </nav>
    )
  }
}

export default Nav
