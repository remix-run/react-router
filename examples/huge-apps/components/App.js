import React from 'react';
import Dashboard from './Dashboard';
import GlobalNav from './GlobalNav';

class App extends React.Component {

  //static loadProps (params, cb) {
    //console.log('App');
    //cb(null, { courses: COURSES });
  //}

  render () {
    //var { courses } = this.props;
    var courses = COURSES;
    return (
      <div>
        <GlobalNav/>
        <div style={{padding: 20}}>
          {this.props.children || <Dashboard courses={courses}/>}
        </div>
      </div>
    );
  }

}

export default App;

