export default function shouldWarn(about) {
  console.error.expected.push(about) // eslint-disable-line no-console
}
