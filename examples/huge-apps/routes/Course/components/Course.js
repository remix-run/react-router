/*globals COURSES:true */
import React from 'react'
import Dashboard from './Dashboard'
import Nav from './Nav'

const styles = {}

styles.sidebar = {
  float: 'left',
  width: 200,
  padding: 20,
  borderRight: '1px solid #aaa',
  marginRight: 20
}

class Course extends React.Component {
  render() {
    let { sidebar, main, params } = this.props
    let course = COURSES[params.courseId]

    return (
      <div>
        <h2>{course.name}</h2>
        <Nav course={course} />
        {sidebar && main ? (
          <div>
            <div className="Sidebar" style={styles.sidebar}>
              {sidebar}
            </div>
            <div className="Main" style={{ padding: 20 }}>
              {main}
            </div>
          </div>
        ) : (
          <Dashboard />
        )}
      </div>
    )
  }
}

export default Course
