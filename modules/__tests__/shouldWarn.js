/*eslint no-console: 0*/

export default function shouldWarn(about) {
  console.error.expected.push(about)
}
