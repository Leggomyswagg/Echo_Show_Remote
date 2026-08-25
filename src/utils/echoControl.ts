export type EchoCommand =
  | 'power' | 'home' | 'back' | 'menu' | 'settings'
  | 'up' | 'down' | 'left' | 'right' | 'select'
  | 'volume_up' | 'volume_down' | 'mute'
  | 'play_pause' | 'rewind' | 'fast_forward'
  | 'brightness_up' | 'brightness_down'
  | 'microphone' | 'camera' | 'do_not_disturb' | 'rotate'
  | 'alexa_text'
  | 'netflix' | 'prime_video' | 'hulu' | 'disney_plus'
  | 'spotify' | 'amazon_music' | 'youtube' | 'twitch'
  | 'smart_home' | 'shopping' | 'calendar' | 'communication';

export interface CommandResult {
  success: boolean;
  message?: string;
}

export type BackendMode = 'skill' | 'local';

const DEFAULT_CLOUD_URL = 'https://echo-show-remote.vercel.app';

export class EchoControlClient {
  private mode: BackendMode;
  private baseUrl: string;
  private cloudUrl: string;
  private alexaUserId: string | null;
  private relayToken: string | null;
  private timeout = 5000;

  constructor(opts: {
    ip?: string;
    port?: string;
    mode?: BackendMode;
    cloudUrl?: string;
    alexaUserId?: string | null;
    relayToken?: string | null;
  } = {}) {
    this.mode = opts.mode ?? 'local';
    this.baseUrl = `http://${opts.ip ?? '192.168.1.100'}:${opts.port ?? '8080'}`;
    this.cloudUrl = opts.cloudUrl ?? DEFAULT_CLOUD_URL;
    this.alexaUserId = opts.alexaUserId ?? null;
    this.relayToken = opts.relayToken ?? null;
  }

  async sendCommand(command: EchoCommand, payload?: Record<string, unknown>): Promise<CommandResult> {
    // `skill` is retained for backwards compatibility with existing screens,
    // but it no longer pretends that Alexa proactive notifications execute commands.
    if (this.mode === 'skill') return this.sendViaRelay(command, payload);
    return this.sendViaLocal(command, payload);
  }

  private async sendViaRelay(command: EchoCommand, payload?: Record<string, unknown>): Promise<CommandResult> {
    const url = this.cloudUrl;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.relayToken) headers.Authorization = `Bearer ${this.relayToken}`;

      const res = await fetch(`${url}/api/relay/command`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: this.alexaUserId, command, payload }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) return { success: true, message: data.message };
      return { success: false, message: data.error ?? `HTTP ${res.status}` };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return { success: false, message: 'Relay timeout' };
      return { success: false, message: 'Relay unreachable' };
    }
  }

  private async sendViaLocal(command: EchoCommand, payload?: Record<string, unknown>): Promise<CommandResult> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.relayToken) headers.Authorization = `Bearer ${this.relayToken}`;
      const response = await fetch(`${this.baseUrl}/command`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ command, payload, text: payload?.text }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) return { success: true, message: data.message };
      return { success: false, message: data.error ?? `HTTP ${response.status}` };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return { success: false, message: 'Connection timeout' };
      return { success: false, message: 'Relay not reachable' };
    }
  }

  async sendAlexaText(text: string): Promise<CommandResult> {
    return this.sendCommand('alexa_text', { text });
  }

  async ping(): Promise<boolean> {
    if (this.mode === 'skill') {
      try {
        const res = await fetch(`${this.cloudUrl}/api/relay/health`);
        return res.ok;
      } catch {
        return false;
      }
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const headers: Record<string, string> = {};
      if (this.relayToken) headers.Authorization = `Bearer ${this.relayToken}`;
      const response = await fetch(`${this.baseUrl}/health`, { signal: controller.signal, headers });
      clearTimeout(timer);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export function getCommandLabel(command: EchoCommand): string {
  const labels: Record<EchoCommand, string> = {
    power: 'Power',
    home: 'Home',
    back: 'Back',
    menu: 'Menu',
    settings: 'Settings',
    up: 'Up',
    down: 'Down',
    left: 'Left',
    right: 'Right',
    select: 'Select',
    volume_up: 'Volume Up',
    volume_down: 'Volume Down',
    mute: 'Mute',
    play_pause: 'Play/Pause',
    rewind: 'Rewind',
    fast_forward: 'Fast Forward',
    brightness_up: 'Brightness Up',
    brightness_down: 'Brightness Down',
    microphone: 'Microphone',
    camera: 'Camera',
    do_not_disturb: 'Do Not Disturb',
    rotate: 'Rotate',
    alexa_text: 'Alexa (Text)',
    netflix: 'Netflix',
    prime_video: 'Prime Video',
    hulu: 'Hulu',
    disney_plus: 'Disney+',
    spotify: 'Spotify',
    amazon_music: 'Amazon Music',
    youtube: 'YouTube',
    twitch: 'Twitch',
    smart_home: 'Smart Home',
    shopping: 'Shopping',
    calendar: 'Calendar',
    communication: 'Communication',
  };
  return labels[command] ?? command;
}
