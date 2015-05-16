import React from 'react';
import Dashboard from './Dashboard';
import { Link } from 'react-router';
import GlobalNav from './GlobalNav';

var styles = {};

class App extends React.Component {

  static getAsyncProps (params, cb) {
    cb(null, { courses: COURSES });
  }

  render () {
    return (
      <div>
        <GlobalNav/>
        <div style={{padding: 20}}>
          {this.props.children || <Dashboard courses={this.props.courses}/>}
        </div>
      </div>
    );
  }

}

export default App;

