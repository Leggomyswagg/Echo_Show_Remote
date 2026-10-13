const { test } = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts');

function response() {
  return { headers: {}, code: 0, data: null, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; }, end() { return this; } };
}
const env = { RELAY_URL: 'https://private-relay.test', RELAY_TOKEN: 'configured-test-token' };
test('cloud gateway rejects missing, incorrect, and malformed caller tokens without contacting relay', async () => {
  for (const route of ['api/relay/command.ts', 'api/command.ts', 'api/alexa/send-command.ts']) {
    const gateway = loadTs(route, { globals: { process: { env }, fetch: () => { throw new Error('Must not contact relay'); } } }).default;
    for (const authorization of [undefined, 'Bearer wrong', 'Bearer configured-test-tokem', 'configured-test-token', ['Bearer configured-test-token']]) {
      const res = response();
      await gateway({ method: 'POST', headers: { authorization }, body: { command: 'play' } }, res);
      assert.equal(res.code, 401, route);
      assert.equal(res.data.error, 'Unauthorized');
    }
  }
});
test('authenticated cloud request forwards server configuration and allowlisted payload to the relay', async () => {
  for (const route of ['api/relay/command.ts', 'api/command.ts', 'api/alexa/send-command.ts']) {
  let forwarded;
  const gateway = loadTs(route, { globals: {
    process: { env },
    fetch: async (url, options) => { forwarded = { url, options }; return { status: 200, text: async () => '{"ok":true}' }; },
  } }).default;
  const res = response();
  await gateway({ method: 'POST', headers: { authorization: 'Bearer configured-test-token' }, body: { command: 'set_volume', payload: { level: 25 }, relayUrl: 'https://untrusted.test' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.data.ok, true);
  assert.equal(forwarded.url, 'https://private-relay.test/command');
  assert.equal(forwarded.options.headers.Authorization, 'Bearer configured-test-token');
  assert.deepEqual(JSON.parse(forwarded.options.body), { command: 'set_volume', payload: { level: 25 } });
  assert.ok(forwarded.options.signal instanceof AbortSignal);
  assert.ok(!JSON.stringify(res.data).includes('configured-test-token'));
  }
});
test('cloud gateway retains method, configuration, and command validation', async () => {
  const gateway = loadTs('api/relay/command.ts', { globals: { process: { env }, fetch: () => { throw new Error('Must not call upstream'); } } }).default;
  for (const [method, body, code] of [['OPTIONS', {}, 204], ['GET', {}, 405], ['POST', { command: 'home' }, 400], ['POST', { command: 'play', payload: null }, 400]]) {
    const res = response();
    await gateway({ method, headers: { authorization: 'Bearer configured-test-token' }, body }, res);
    assert.equal(res.code, code);
  }
  const unconfigured = loadTs('api/relay/command.ts').default;
  const res = response();
  await unconfigured({ method: 'POST', headers: {}, body: { command: 'play' } }, res);
  assert.equal(res.code, 503);
});
test('cloud health authenticates the caller before forwarding a bounded readiness request', async () => {
  let calls = 0;
  const health = loadTs('api/relay/health.ts', { globals: {
    process: { env },
    fetch: async (url, options) => {
      calls++;
      assert.equal(url, 'https://private-relay.test/health');
      assert.equal(options.headers.Authorization, 'Bearer configured-test-token');
      assert.ok(options.signal instanceof AbortSignal);
      return { status: 200, text: async () => '{"ok":true,"ready":true}' };
    },
  } }).default;
  for (const token of [undefined, 'Bearer wrong']) {
    const res = response();
    await health({ method: 'GET', headers: { authorization: token } }, res);
    assert.equal(res.code, 401);
  }
  assert.equal(calls, 0);
  const res = response();
  await health({ method: 'GET', headers: { authorization: 'Bearer configured-test-token' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.data.ready, true);
  assert.equal(calls, 1);
  assert.equal(res.headers['Cache-Control'], 'no-store');
});
test('malformed or unreachable cloud health never returns raw relay errors', async () => {
  for (const fetchImpl of [async () => ({ status: 200, text: async () => 'private error' }), async () => { throw new Error('private error'); }]) {
    const health = loadTs('api/relay/health.ts', { globals: { process: { env }, fetch: fetchImpl } }).default;
    const res = response();
    await health({ method: 'GET', headers: { authorization: 'Bearer configured-test-token' } }, res);
    assert.equal(res.code, 502);
    assert.ok(!JSON.stringify(res.data).includes('private error'));
  }
});
test('app sends configured credentials through both local and cloud transports', async () => {
  const calls = [];
  const { EchoControlClient } = loadTs('src/utils/echoControl.ts', { globals: { fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ ok: true }) }; } } });
  const local = new EchoControlClient({ mode: 'local', ip: '192.168.1.50', port: '8081', relayToken: 'entered-token' });
  assert.equal((await local.sendCommand('play')).success, true);
  assert.equal(calls[0].url, 'http://192.168.1.50:8081/command');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer entered-token');
  const cloud = new EchoControlClient({ mode: 'skill', cloudUrl: 'https://app.test', relayToken: 'entered-token' });
  assert.equal((await cloud.sendCommand('pause')).success, true);
  assert.equal(calls[1].url, 'https://app.test/api/relay/command');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer entered-token');
  assert.equal((await cloud.sendCommand('home')).success, false);
  const noToken = new EchoControlClient({ mode: 'skill', cloudUrl: 'https://app.test' });
  assert.equal((await noToken.sendCommand('play')).success, false);
  assert.equal(calls.length, 2);
});
test('connection checks require authentication and actual relay readiness', async () => {
  let ready = true;
  let calls = 0;
  const { EchoControlClient } = loadTs('src/utils/echoControl.ts', { globals: {
    fetch: async (url, options) => {
      calls++;
      assert.equal(options.headers.Authorization, 'Bearer entered-token');
      assert.ok(options.signal instanceof AbortSignal);
      return { ok: true, json: async () => ({ ready }) };
    },
  } });
  assert.equal(await new EchoControlClient({ mode: 'skill', cloudUrl: 'https://app.test' }).ping(), false);
  assert.equal(calls, 0);
  for (const mode of ['local', 'skill']) {
    const client = new EchoControlClient({ mode, cloudUrl: 'https://app.test', relayToken: 'entered-token' });
    ready = true;
    assert.equal(await client.ping(), true);
    ready = false;
    assert.equal(await client.ping(), false);
  }
});
test('native widget commands use the saved relay credential', async () => {
  let forwarded;
  const { widgetTaskHandler } = loadTs('src/components/widget/widgetTaskHandler.ts', { mocks: {
    '@react-native-async-storage/async-storage': { default: { getItem: async key => key === 'device_ip' ? '192.168.1.50' : '8081' } },
    '../../utils/relayCredentials': { RelayCredentials: { getToken: async () => 'widget-test-token' } },
  }, globals: {
    fetch: async (url, options) => { forwarded = { url, options }; return { ok: true }; },
  } });
  await widgetTaskHandler({ widgetAction: 'CLICK', clickAction: 'VOL_UP' });
  assert.equal(forwarded.url, 'http://192.168.1.50:8081/command');
  assert.equal(forwarded.options.headers.Authorization, 'Bearer widget-test-token');
  assert.deepEqual(JSON.parse(forwarded.options.body), { command: 'volume_up' });
});
test('web credentials exist only in session memory and can be cleared', async () => {
  const { RelayCredentials } = loadTs('src/utils/relayCredentials.ts', { mocks: {
    'react-native': { Platform: { OS: 'web' } },
    'expo-secure-store': {},
  } });
  assert.equal(await RelayCredentials.getToken(), null);
  await RelayCredentials.saveToken('  session-test-token  ');
  assert.equal(await RelayCredentials.getToken(), 'session-test-token');
  await RelayCredentials.saveToken('');
  assert.equal(await RelayCredentials.getToken(), null);
});
test('native credentials use secure store, never app settings storage', async () => {
  const saved = new Map();
  const { RelayCredentials } = loadTs('src/utils/relayCredentials.ts', { mocks: {
    'react-native': { Platform: { OS: 'android' } },
    'expo-secure-store': { getItemAsync: async key => saved.get(key) || null, setItemAsync: async (key, value) => saved.set(key, value), deleteItemAsync: async key => saved.delete(key) },
  } });
  await RelayCredentials.saveToken('native-test-token');
  assert.equal(await RelayCredentials.getToken(), 'native-test-token');
  await RelayCredentials.saveToken(null);
  assert.equal(await RelayCredentials.getToken(), null);
  assert.equal(saved.size, 0);
});
