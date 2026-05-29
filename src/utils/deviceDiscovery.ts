import * as Network from 'expo-network';

export interface DiscoveredDevice {
  ip: string;
  port: number;
  host: string;
}

const PORTS = [8080, 5000, 3000, 8000];
const SCAN_TIMEOUT_MS = 600;

async function pingDevice(ip: string, port: number): Promise<DiscoveredDevice | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SCAN_TIMEOUT_MS);
    const res = await fetch(`http://${ip}:${port}/ping`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) return { ip, port, host: `${ip}:${port}` };
  } catch { /* unreachable */ }
  return null;
}

async function checkHost(ip: string): Promise<DiscoveredDevice | null> {
  for (const port of PORTS) {
    const result = await pingDevice(ip, port);
    if (result) return result;
  }
  return null;
}

// Scan subnet in priority order: gateway/common IPs first, then full sweep
function buildScanOrder(subnet: string): string[] {
  // Priority: .1 .2 .100–.120 .200–.220 .254, then remainder
  const priority = [
    1, 2, 254,
    ...Array.from({ length: 21 }, (_, i) => i + 100),
    ...Array.from({ length: 21 }, (_, i) => i + 200),
  ];
  const prioritySet = new Set(priority);
  const rest = Array.from({ length: 254 }, (_, i) => i + 1).filter(n => !prioritySet.has(n));
  return [...priority, ...rest].map(n => `${subnet}.${n}`);
}

export async function discoverDevices(
  onFound: (device: DiscoveredDevice) => void,
  onProgress: (pct: number) => void,
  signal: AbortSignal
): Promise<void> {
  let localIp = '192.168.1.1';
  try {
    localIp = await Network.getIpAddressAsync();
  } catch { /* fallback */ }

  const subnet = localIp.split('.').slice(0, 3).join('.');
  const hosts = buildScanOrder(subnet);
  const total = hosts.length;
  let scanned = 0;
  const CONCURRENCY = 25;

  for (let i = 0; i < hosts.length; i += CONCURRENCY) {
    if (signal.aborted) break;
    const batch = hosts.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(ip => checkHost(ip)));
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) onFound(r.value);
    });
    scanned += batch.length;
    onProgress(Math.round((scanned / total) * 100));
  }
}
