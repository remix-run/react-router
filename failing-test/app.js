import { hashHistory } from '../lib' // simulate react-router as a package

export default function app() {
  hashHistory.push('./foo')
}
