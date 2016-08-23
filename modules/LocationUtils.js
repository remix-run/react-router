// TODO: Have Michael comb over this, I don't know the history of history (hehehe)
//import invariant from 'invariant'
import { parsePath } from './PathUtils'

const POP = 'POP'

//export const createQuery = (props) =>
  //Object.assign(Object.create(null), props)

export const createLocation = ({ input, parseQuery, action = POP, key = null }) => {
  const object = typeof input === 'string' ? parsePath(input) : input

  const pathname = object.pathname || '/'
  const search = object.search || ''
  const query = object.query || parseQuery(search)
  const hash = object.hash || ''

  return {
    pathname,
    search,
    query,
    hash,
    action,
    key
  }
}

//const isDate = (object) =>
  //Object.prototype.toString.call(object) === '[object Date]'

//export const statesAreEqual = (a, b) => {
  //if (a === b)
    //return true

  //const typeofA = typeof a
  //const typeofB = typeof b

  //if (typeofA !== typeofB)
    //return false

  //invariant(
    //typeofA !== 'function',
    //'You must not store functions in location state'
  //)

  //// Not the same object, but same type.
  //if (typeofA === 'object') {
    //invariant(
      //!(isDate(a) && isDate(b)),
      //'You must not store Date objects in location state'
    //)

    //if (!Array.isArray(a))
      //return Object.keys(a).every(key => statesAreEqual(a[key], b[key]))

    //return Array.isArray(b) &&
      //a.length === b.length &&
      //a.every((item, index) => statesAreEqual(item, b[index]))
  //}

  //// All other serializable types (string, number, boolean)
  //// should be strict equal.
  //return false
//}

//export const locationsAreEqual = (a, b) =>
  //a.key === b.key &&
  //// a.action === b.action && // Different action !== location change.
  //a.pathname === b.pathname &&
  //a.search === b.search &&
  //a.hash === b.hash &&
  //statesAreEqual(a.state, b.state)

