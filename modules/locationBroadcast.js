/*eslint react/prop-types: 0*/
import React from 'react'
import { Broadcast, Subscriber } from 'react-broadcast'

const NAME = 'location'

const LocationBroadcast = ({ children, value }) =>
  <Broadcast channel={NAME} value={value} children={children}/>

const LocationSubscriber = ({ children }) =>
  <Subscriber channel={NAME} children={children}/>

export { LocationBroadcast, LocationSubscriber }
