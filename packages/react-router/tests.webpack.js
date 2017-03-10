var context = require.context('./modules', true, /-test\.js$/)
context.keys().forEach(context)
