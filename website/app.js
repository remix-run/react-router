// need to fix the marked output of these things, for some reason they are wrapped
// in `pre > code > div.highlight > pre
[].slice.call(document.getElementsByClassName('highlight')).forEach(function(el) {
  var stupidPre = el.parentNode.parentNode;
  var parent = stupidPre.parentNode;
  parent.insertBefore(el, stupidPre);
  parent.removeChild(stupidPre);
});

var version = document.getElementById('version');

var segments = document.location.pathname.split('/');
if (segments.indexOf('tags') !== -1)
  version.value = segments[2].replace(/\.html$/, '');

version.addEventListener('change', function() {
  document.location = '/react-router/tags/'+this.value+'.html';
}, false);

