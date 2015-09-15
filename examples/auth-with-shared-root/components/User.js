import React from "react";

var User = React.createClass({
  render() {
    return <h1>User: {this.props.params.id}</h1>;
  }
});

export default User;
