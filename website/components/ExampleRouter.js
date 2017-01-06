import React from 'react'

const ExampleRouter = ({ children }) => (
  children ? React.Children.only(children) : null
)

export default ExampleRouter
