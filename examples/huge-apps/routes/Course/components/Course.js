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
    let { children, params } = this.props
    let course = COURSES[params.courseId]

    return (
      <div>
        <h2>{course.name}</h2>
        <Nav course={course} />
        {children && children.sidebar && children.main ? (
          <div>
            <div className="Sidebar" style={styles.sidebar}>
              {children.sidebar}
            </div>
            <div className="Main" style={{ padding: 20 }}>
              {children.main}
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
