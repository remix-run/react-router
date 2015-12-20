/*eslint no-console: 0*/

if (process.env.FAIL_ON_WARNINGS) {
  console.error = function (msg) {
    // grant me the serenity to accept the things I cannot change,
    if (msg.match(/Warning: the query argument to createHref is deprecated; use a location descriptor instead/))
      return
    else
      throw new Error(msg)
  }
}

const context = require.context('./modules', true, /-test\.js$/)

context.keys().forEach(key => {
  if (process.env.SKIP_BC) {
    if (!key.match(/_bc/)) {
      context(key)
    }
  } else {
    context(key)
  }
})
