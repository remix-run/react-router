import React from 'react';
import Dashboard from './Dashboard';
import GlobalNav from './GlobalNav';

class App extends React.Component {

  static loadProps (params, cb) {
    console.log('App', 'loadProps');
    cb(null, { courses: COURSES });
  }

  render () {
    var { courses, loading } = this.props;
    return (
      <div style={{opacity: loading ? 0.66 : 1}}>
        <GlobalNav/>
        <div style={{padding: 20}}>
          {this.props.children || <Dashboard courses={courses}/>}
        </div>
      </div>
    );
  }

}

export default App;

