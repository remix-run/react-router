// modified version of https://github.com/valor-software/prismjs-loader
'use strict';
const Prism = require('prismjs');

module.exports = function loader(content) {
  const query = this.query

  if (!query.lang) {
    throw new Error('You need to provide `lang` query parameter');
  }

  if (!Prism.languages[query.lang]) {
    /* eslint-disable */
    require(`prismjs/components/prism-${query.lang}.js`);
    /* eslint-enable */
  }

  const lang = Prism.languages[query.lang];

  const value = Prism.highlight(content, lang);
  const str = JSON.stringify(value);

  return `module.exports = ${str}`;
};

module.exports.seperable = true;
