const markdownIt = require('markdown-it')
const frontMatter = require('front-matter')
const Prism = require('prismjs')
require(`prismjs/components/prism-jsx.js`)

const highlight = (str, lang) => {
  if (lang === 'js') {
    return Prism.highlight(str, Prism.languages.jsx)
  } else {
    return str
  }
}

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight
})

module.exports = function (content) {
  this.cacheable()
  this.value = md.render(content)
  return `module.exports = ${JSON.stringify(this.value)}`
}
