import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'

var config = {
  output: {
    format: 'umd',
    name: 'ReactRouterRedux',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ],
  external: [
    'react',
    'prop-types',
    'react-router'
  ],
  globals: {
    react: 'React',
    'prop-types': 'PropTypes',
    'react-router': 'ReactRouter'
  }
}

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  )
}

export default config
