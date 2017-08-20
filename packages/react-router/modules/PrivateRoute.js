import {Route, Redirect} from 'react-router-dom';
import React from 'react'

/**
* A route that checks for an authenticated property and redirects if not present or false.
*/
export default ({component: Component, ...extraProps}) => {
  return (<Route
    {...extraProps}
    render={(props) =>
      extraProps.authenticated
      ?
      <Component {...props} />
      :
      <Redirect to={{
        pathname: extraProps.redirectPath ? extraProps.redirectPath : '/login',
        state: {from: props.location}
      }} />
    }
  />)
}
