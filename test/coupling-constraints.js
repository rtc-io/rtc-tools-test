var test = require('tape');
var conns = [];
var signallers = [];
var monitors = [];
var scope = [];
var messengers = [];
var dcs = [];
var roomId = require('uuid').v4();
var remoteIds = [];

module.exports = function(rtc, createSignaller, opts) {
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
      t.pass('1 knows about 0')
    });

    signallers[0].announce({ room: roomId });
    signallers[1].announce({ room: roomId });
  });

  test('couple a --> b', function(t) {
    t.plan(1);

    monitors[0] = rtc.couple(conns[0], remoteIds[1], signallers[0], {
      debugLabel: 'conn:0',
      offerToReceiveVideo: false,
      offerToReceiveAudio: false
    });

    t.ok(monitors[0], 'ok');
  });

  test('couple b --> a', function(t) {
    t.plan(1);

    monitors[1] = rtc.couple(conns[1], remoteIds[0], signallers[1], {
      debugLabel: 'conn:1',
      offerToReceiveVideo: false,
      offerToReceiveAudio: false
    });

    t.ok(monitors[1], 'ok');
  });

  test('create a data channel on the master connection', function(t) {
    var masterIdx = signallers[0].isMaster(remoteIds[1]) ? 0 : 1;

    t.plan(1);

    dcs[masterIdx] = conns[masterIdx].createDataChannel('test');
    conns[masterIdx ^ 1].ondatachannel = function(evt) {
      dcs[masterIdx ^ 1] = evt.channel;
      t.pass('got data channel');
    };

    monitors[0].createOffer();
  });

  test('close the connections', function(t) {
    t.plan(conns.length);
    conns.forEach(function(conn, index) {
      monitors[index].once('closed', t.pass.bind(t, 'closed connection: ' + index));
      conn.close();
    });
  });

  test('close the signallers', function(t) {
    t.plan(signallers.length);
    signallers.splice(0).forEach(function(sig) {
      sig.once('disconnected', t.pass.bind(t, 'disconnected'));
      sig.close();
    });
  });

  test('release references', function(t) {
    t.plan(1);
    conns = [];
    monitors = [];
    dcs = [];
    t.pass('done');
  });
};
