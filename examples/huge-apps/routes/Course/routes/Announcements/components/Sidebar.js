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

/*globals COURSES:true */
import React, { Component } from 'react'
import { Link } from '@americanexpress/one-app-router'

class AnnouncementsSidebar extends Component {
  render() {
    let { announcements } = COURSES[this.props.params.courseId]

    return (
      <div>
        <h3>Sidebar Assignments</h3>
        <ul>
          {announcements.map(announcement => (
            <li key={announcement.id}>
              <Link to={`/course/${this.props.params.courseId}/announcements/${announcement.id}`}>
                {announcement.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

module.exports = AnnouncementsSidebar
