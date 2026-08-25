const os = require('os');
const AlexaRemote = require('alexa-remote2');

const alexa = new AlexaRemote();
const proxyPort = Number(process.env.ALEXA_PROXY_PORT || 3001);
const proxyOwnIp = process.env.ALEXA_PROXY_IP || process.env.RELAY_HOST || '127.0.0.1';

console.log(`Starting Alexa authentication proxy on ${proxyOwnIp}:${proxyPort}`);
console.log('Open the printed proxy URL in a browser on the same machine, complete Amazon authentication, and return here.');
console.log(`Detected host addresses: ${Object.values(os.networkInterfaces()).flat().filter(Boolean).filter(x => !x.internal && x.family === 'IPv4').map(x => x.address).join(', ')}`);

alexa.on('cookie', (cookie, csrf, macDms) => {
  const cookieData = alexa.cookieData || { cookie, csrf, macDms };
  console.log('\n=== ALEXA_COOKIE_JSON ===');
  console.log(JSON.stringify(cookieData));
  console.log('=== END ALEXA_COOKIE_JSON ===\n');
  console.log('Copy the JSON into the relay host secret store as ALEXA_COOKIE_JSON.');
});

alexa.init({
  proxyOnly: true,
  proxyOwnIp,
  proxyPort,
  proxyLogLevel: 'info',
  amazonPage: process.env.AMAZON_PAGE || 'amazon.com',
  deviceAppName: 'Echo Show Remote',
}, err => {
  if (err) {
    console.error('Authentication proxy failed:', err);
    process.exitCode = 1;
    return;
  }
  console.log(`Proxy ready. Browse to http://${proxyOwnIp}:${proxyPort}`);
});

process.on('SIGINT', () => { try { alexa.stop(); } finally { process.exit(0); } });
