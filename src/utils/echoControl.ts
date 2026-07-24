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

// Default cloud endpoint — override via constructor for staging/self-hosted
const DEFAULT_CLOUD_URL = 'https://echo-show-remote.vercel.app';

export class EchoControlClient {
  private mode: BackendMode;
  private baseUrl: string;
  private cloudUrl: string;
  private alexaUserId: string | null;
  private timeout = 3000;

  constructor(opts: {
    ip?: string;
    port?: string;
    mode?: BackendMode;
    cloudUrl?: string;
    alexaUserId?: string | null;
  } = {}) {
    this.mode = opts.mode ?? 'skill';
    this.baseUrl = `http://${opts.ip ?? '192.168.1.100'}:${opts.port ?? '8080'}`;
    this.cloudUrl = opts.cloudUrl ?? DEFAULT_CLOUD_URL;
    this.alexaUserId = opts.alexaUserId ?? null;
  }

  async sendCommand(command: EchoCommand, payload?: Record<string, unknown>): Promise<CommandResult> {
    if (this.mode === 'skill') return this.sendViaSkill(command, payload);
    return this.sendViaLocal(command, payload);
  }

  private async sendViaSkill(command: EchoCommand, payload?: Record<string, unknown>): Promise<CommandResult> {
    if (!this.alexaUserId) {
      return { success: false, message: 'Alexa account not linked' };
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${this.cloudUrl}/api/alexa/send-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.alexaUserId, command, ...payload }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) return { success: true };
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.error ?? `HTTP ${res.status}` };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, message: 'Cloud timeout' };
      }
      return { success: false, message: 'Cloud unreachable' };
    }
  }

  private async sendViaLocal(command: EchoCommand, payload?: Record<string, unknown>): Promise<CommandResult> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      const response = await fetch(`${this.baseUrl}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, ...payload }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.ok) return { success: true };
      return { success: false, message: `HTTP ${response.status}` };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, message: 'Connection timeout' };
      }
      return { success: false, message: 'Device not reachable' };
    }
  }

  async sendAlexaText(text: string): Promise<CommandResult> {
    if (this.mode === 'skill') {
      if (!this.alexaUserId) return { success: false, message: 'Alexa account not linked' };
      try {
        const res = await fetch(`${this.cloudUrl}/api/alexa/send-command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.alexaUserId, command: 'alexa_text', text }),
        });
        if (res.ok) return { success: true };
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.error ?? `HTTP ${res.status}` };
      } catch { return { success: false, message: 'Cloud unreachable' }; }
    }
    return this.sendCommand('alexa_text', { text });
  }

  async ping(): Promise<boolean> {
    if (this.mode === 'skill') {
      return this.alexaUserId !== null;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${this.baseUrl}/ping`, { signal: controller.signal });
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
