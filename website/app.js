// need to fix the marked output of these things, for some reason they are wrapped
// in `pre > code > div.highlight > pre
[].slice.call(document.getElementsByClassName('highlight')).forEach(function (el) {
  var stupidPre = el.parentNode.parentNode;
  var parent = stupidPre.parentNode;
  parent.insertBefore(el, stupidPre);
  parent.removeChild(stupidPre);
});

