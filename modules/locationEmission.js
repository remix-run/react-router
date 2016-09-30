import { createContextEmitter, createContextSubscriber } from 'react-context-emission'

const NAME = 'location'
const LocationEmitter = createContextEmitter(NAME)
const LocationSubscriber = createContextSubscriber(NAME)

export { LocationEmitter, LocationSubscriber }
