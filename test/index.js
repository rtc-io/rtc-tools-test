var detect = require('rtc-core/detect');

module.exports = function(tools, createSignaller, opts) {
  require('./coupling')(tools, createSignaller, opts);
  require('./coupling-constraints')(tools, createSignaller, opts);
  require('./capture-close-localonly')(tools, createSignaller, opts);
  require('./coupling-abort')(tools, createSignaller, opts);
  require('./coupling-reactive-randomdelaystreams')(tools, createSignaller, opts);

  if (! detect.moz) {
    require('./coupling-reactive')(tools, createSignaller, opts);
    require('./coupling-reactive-randomdelay')(tools, createSignaller, opts);
    require('./coupling-reactive')(tools, createSignaller, opts);
    require('./coupling-reactive-randomdelay')(tools, createSignaller, opts);
    require('./capture-close')(tools, createSignaller, opts);
  }
};
