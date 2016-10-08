import React from 'react'
import { Broadcast, Subscriber } from 'react-broadcast'

const LocationChannel = 'location'

export const LocationBroadcast = (props) =>
  <Broadcast {...props} channel={LocationChannel}/>

export const LocationSubscriber = (props) =>
  <Subscriber {...props} channel={LocationChannel}/>
