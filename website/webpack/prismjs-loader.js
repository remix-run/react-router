/*
 * modified version of https://github.com/valor-software/prismjs-loader
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015-2016 Valor Software
 * Copyright (c) 2015-2016 Dmitriy Shekhovtsov<valorkin@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
