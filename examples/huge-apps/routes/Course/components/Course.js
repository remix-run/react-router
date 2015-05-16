import React from 'react';
import Dashboard from './Dashboard';
import Nav from './Nav';

var styles = {};

styles.sidebar = {
  float: 'left',
  width: 200,
  padding: 20,
  borderRight: '1px solid #aaa',
  marginRight: 20
};

class Course extends React.Component {

  static getAsyncProps (params, cb) {
    cb(null, { course: COURSES[params.courseId] });
  }

  render () {
    var { course } = this.props;
    return (
      <div>
        <h2>{course.name}</h2>
        <Nav course={course}/>
        {this.props.sidebar && this.props.main ? (
          <div>
            <div className="Sidebar" style={styles.sidebar}>
              {this.props.sidebar}
            </div>
            <div className="Main" style={{padding: 20}}>
              {this.props.main}
            </div>
          </div>
        ) : (
          <Dashboard/>
        )}
      </div>
    );
  }

}

export default Course;

