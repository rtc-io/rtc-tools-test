var test = require('tape');
var signallers = [];
var monitors = [];
var scope = [];
var messengers = [];
var dcs = [];
var conns = [];
var roomId = require('uuid').v4();
var remoteIds = [];

module.exports = function(rtc, createSignaller, opts) {

  // Prevent connections from being established
  var coupleOpts = {
    filterCandidate: function(data) {
      return false;
    },
    failTimeout: 2000
  };

  test('create peer connections', function(t) {
    t.plan(2);

    t.ok(conns[0] = rtc.createConnection(), 'created a');
    t.ok(conns[1] = rtc.createConnection(), 'created b');

  });

  test('create signallers', function(t) {
    t.plan(2);

    t.ok(signallers[0] = createSignaller(opts), 'created signaller a');
    t.ok(signallers[1] = createSignaller(opts), 'created signaller b');
  });

  test('announce signallers', function(t) {
    t.plan(2);
    signallers[0].once('peer:announce', function(data){
      remoteIds[1] = data.id;
      t.pass('0 knows about 1');
    });
    signallers[1].once('peer:announce', function(data){
      remoteIds[0] = data.id;
      t.pass('1 knows about 0');
    });

    signallers[0].announce({ room: roomId });
    signallers[1].announce({ room: roomId });
  });

  test('couple a --> b', function(t) {
    t.plan(1);

    monitors[0] = rtc.couple(conns[0], remoteIds[1], signallers[0], coupleOpts);
    t.ok(monitors[0], 'ok');
  });

  test('couple b --> a', function(t) {
    t.plan(1);

    monitors[1] = rtc.couple(conns[1], remoteIds[0], signallers[1], coupleOpts);
    t.ok(monitors[1], 'ok');
  });

  test('abort the connection', function(t) {
    t.plan(conns.length);

    monitors[0].once('aborted', t.pass.bind(t, 'aborted connection 0'));
    monitors[1].once('closed', t.pass.bind(t, 'closed connection 1'));
    monitors[1].once('failed', t.pass.bind(t, 'failed connection 1'));

    monitors[0].abort();
  });

  test('release references', function(t) {
    t.plan(1);
    conns = [];
    monitors = [];
    dcs = [];
    t.pass('done');
  });
};
