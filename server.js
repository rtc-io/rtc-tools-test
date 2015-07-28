var http = require('http');

module.exports = function() {
  var server = http.createServer();
  var port = process.env.ZUUL_PORT || process.env.PORT;
  var switchboard = require('rtc-switchboard')(server, { servelib: true });

  switchboard.on('fake:disconnect', function(msg, spark) {
    spark.end(null, { reconnect: true });
  });

  switchboard.on('fake:leave', function(msg, spark) {
    spark.end();
  });

  return server;
};