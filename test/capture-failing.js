var test = require('tape');

module.exports = function(rtc, createSignaller, opts) {

  var signallers = [];
  var monitors = [];
  var scope = [];
  var messengers = [];
  var dcs = [];
  var conns = [];
  var roomId = require('uuid').v4();
  var remoteIds = [];

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

    monitors[0] = rtc.couple(conns[0], remoteIds[1], signallers[0], {disconnectTimeout: 1000, failTimeout: 1000});
    t.ok(monitors[0], 'ok');
  });

  test('couple b --> a', function(t) {
    t.plan(1);

    monitors[1] = rtc.couple(conns[1], remoteIds[0], signallers[1], {disconnectTimeout: 1000, failTimeout: 1000});
    t.ok(monitors[1], 'ok');
  });

  test('create a data channel on the master connection', function(t) {
    var masterIdx = signallers[0].isMaster(remoteIds[1]) ? 0 : 1;
    t.plan(1);

    // Note: This is a mongrel.
    // Basically, Chrome has an error (https://bugs.chromium.org/p/webrtc/issues/detail?id=3792)
    // whereby this test, running so soon after the test in `coupling`, results (somehow)
    // in a data channel with the same SID (being 1) being created. This data channel is then
    // closed prematurely (because they get mixed up).
    // To avoid this, we pass in a custom channel ID (34) to solve the problem... but dang, that's
    // ugly
    var channel = dcs[masterIdx] = conns[masterIdx].createDataChannel('failing', { id: 34 });
    conns[masterIdx ^ 1].ondatachannel = function(evt) {
      channel.onclose = undefined;
      dcs[masterIdx ^ 1] = evt.channel;
      t.pass('got data channel');
    };

    channel.onclose = function() {
      t.fail('data channel closed before peer received');
    };

    monitors[0].createOffer();
  });

  test('Check that we get a failing event.', function(t) {
    t.plan(3);
    monitors[0].once('failing', function(){
      t.pass('failing peer fires failing event');
      monitors[0].once('closed', t.pass.bind(t, 'failing peer is closed'));
    });
    monitors[0].once('recovered', t.fail.bind(t, 'failing peer should not have recovered'));
    monitors[1].once('failing', t.fail.bind(t, 'fail should not be received by closing peer'));
    monitors[1].once('closed', t.pass.bind(t, 'closed peer fires closed event.'));
    conns[1].close();
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
