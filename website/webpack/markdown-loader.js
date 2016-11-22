const markdownIt = require('markdown-it')
const Prism = require('prismjs')
const anchor = require('markdown-it-anchor')

const aliases = {
  'js': 'jsx',
  'html': 'markup'
}

const highlight = (str, lang) => {
  if (!lang) {
    return str
  } else {
    lang = aliases[lang] || lang
    require(`prismjs/components/prism-${lang}.js`)
    if (Prism.languages[lang]) {
      return Prism.highlight(str, Prism.languages[lang])
    } else {
      return str
    }
  }
}

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight
}).use(anchor, {
  permalink: true,
  permalinkSymbol: '#',
  permalinkBefore: true
})

module.exports = function (content) {
  this.cacheable()
  this.value = md.render(content)
  return `module.exports = ${JSON.stringify(this.value)}`
}
