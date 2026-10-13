const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function healthRoute(env) {
  const middleware = [];
  let health;
  let initialize;
  const app = {
    use(route, handler) { if (route === '/health') middleware.push(handler); },
    get(route, handler) { if (route === '/health') health = handler; },
    post() {},
    listen(_port, _host, callback) { initialize = callback; },
  };
  const express = () => app;
  express.json = () => () => {};
  class MockAlexa {
    init(_options, callback) { callback(null); }
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../relay/server.js'), 'utf8'), {
    require(name) {
      if (name === 'express') return express;
      if (name === 'alexa-remote2') return MockAlexa;
      return require(name);
    },
    Buffer,
    process: { env, on() {} },
    console: { log() {}, warn() {}, error() {} },
    setInterval: () => ({ unref() {} }),
  });
  initialize();
  await Promise.resolve();
  return authorization => {
    const req = { get: name => name === 'authorization' ? authorization : undefined };
    const res = {
      code: 200,
      status(code) { this.code = code; return this; },
      json(data) { this.data = data; return this; },
    };
    const handlers = [...middleware, health];
    let index = 0;
    const next = () => handlers[index++]?.(req, res, next);
    next();
    return res;
  };
}

test('a ready local relay rejects missing and incorrect tokens before reporting readiness', async () => {
  const request = await healthRoute({ RELAY_TOKEN: 'local-test-token', ALEXA_COOKIE_JSON: '{}' });
  for (const token of [undefined, 'Bearer wrong', 'Bearer local-test-tokem']) {
    const res = request(token);
    assert.equal(res.code, 401);
    assert.equal(res.data.error, 'Unauthorized');
    assert.equal(res.data.ready, undefined);
  }
  const res = request('Bearer local-test-token');
  assert.equal(res.code, 200);
  assert.equal(res.data.ready, true);
});

test('an authenticated local relay still reports unavailable Alexa as not ready', async () => {
  const request = await healthRoute({ RELAY_TOKEN: 'local-test-token' });
  const res = request('Bearer local-test-token');
  assert.equal(res.code, 503);
  assert.equal(res.data.ready, false);
});

test('token-free local health requires an explicit trusted-LAN development setting', async () => {
  const locked = await healthRoute({ ALEXA_COOKIE_JSON: '{}' });
  assert.equal(locked().code, 401);
  const development = await healthRoute({ ALEXA_COOKIE_JSON: '{}', RELAY_TOKEN_REQUIRED: 'false' });
  assert.equal(development().code, 200);
});
