import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  BACKGROUND_TYPE: 'bg_type',
  BACKGROUND_COLOR: 'bg_color',
  BACKGROUND_IMAGE: 'bg_image',
  BACKGROUND_GRADIENT: 'bg_gradient',
  DEVICE_IP: 'device_ip',
  DEVICE_PORT: 'device_port',
  ECHO_GENERATION: 'echo_gen',
  RECENT_HOSTS: 'recent_hosts',
  COMMAND_HISTORY: 'cmd_history',
  HAPTICS_ENABLED: 'haptics',
  CUSTOM_BUTTONS: 'custom_btns',
  LAST_CONNECTED: 'last_connected',
  BACKEND_MODE: 'backend_mode',
  ALEXA_USER_ID: 'alexa_user_id',
};

export type BackgroundType = 'color' | 'image' | 'gradient' | 'default';
export type BackendMode = 'skill' | 'local';

export interface AppSettings {
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundGradient: string[];
  deviceIp: string;
  devicePort: string;
  echoGeneration: string;
  hapticsEnabled: boolean;
  backendMode: BackendMode;
  alexaUserId: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  backgroundType: 'default',
  backgroundColor: '#131921',
  backgroundImage: null,
  backgroundGradient: ['#131921', '#1A2535'],
  deviceIp: '192.168.1.100',
  devicePort: '8080',
  echoGeneration: 'show10',
  hapticsEnabled: true,
  backendMode: 'skill',
  alexaUserId: null,
};

export const Storage = {
  async getSettings(): Promise<AppSettings> {
    try {
      const keys = Object.values(KEYS);
      const pairs = await AsyncStorage.multiGet(keys);
      const data: Record<string, string | null> = {};
      pairs.forEach(([key, value]) => { data[key] = value; });

      return {
        backgroundType: (data[KEYS.BACKGROUND_TYPE] as BackgroundType) ?? DEFAULT_SETTINGS.backgroundType,
        backgroundColor: data[KEYS.BACKGROUND_COLOR] ?? DEFAULT_SETTINGS.backgroundColor,
        backgroundImage: data[KEYS.BACKGROUND_IMAGE] ?? null,
        backgroundGradient: data[KEYS.BACKGROUND_GRADIENT]
          ? JSON.parse(data[KEYS.BACKGROUND_GRADIENT]!)
          : DEFAULT_SETTINGS.backgroundGradient,
        deviceIp: data[KEYS.DEVICE_IP] ?? DEFAULT_SETTINGS.deviceIp,
        devicePort: data[KEYS.DEVICE_PORT] ?? DEFAULT_SETTINGS.devicePort,
        echoGeneration: data[KEYS.ECHO_GENERATION] ?? DEFAULT_SETTINGS.echoGeneration,
        hapticsEnabled: data[KEYS.HAPTICS_ENABLED] !== 'false',
        backendMode: (data[KEYS.BACKEND_MODE] as BackendMode) ?? DEFAULT_SETTINGS.backendMode,
        alexaUserId: data[KEYS.ALEXA_USER_ID] || null,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const pairs: [string, string][] = [];
      if (settings.backgroundType !== undefined)
        pairs.push([KEYS.BACKGROUND_TYPE, settings.backgroundType]);
      if (settings.backgroundColor !== undefined)
        pairs.push([KEYS.BACKGROUND_COLOR, settings.backgroundColor]);
      if (settings.backgroundImage !== undefined)
        pairs.push([KEYS.BACKGROUND_IMAGE, settings.backgroundImage ?? '']);
      if (settings.backgroundGradient !== undefined)
        pairs.push([KEYS.BACKGROUND_GRADIENT, JSON.stringify(settings.backgroundGradient)]);
      if (settings.deviceIp !== undefined)
        pairs.push([KEYS.DEVICE_IP, settings.deviceIp]);
      if (settings.devicePort !== undefined)
        pairs.push([KEYS.DEVICE_PORT, settings.devicePort]);
      if (settings.echoGeneration !== undefined)
        pairs.push([KEYS.ECHO_GENERATION, settings.echoGeneration]);
      if (settings.hapticsEnabled !== undefined)
        pairs.push([KEYS.HAPTICS_ENABLED, String(settings.hapticsEnabled)]);
      if (settings.backendMode !== undefined)
        pairs.push([KEYS.BACKEND_MODE, settings.backendMode]);
      if (settings.alexaUserId !== undefined)
        pairs.push([KEYS.ALEXA_USER_ID, settings.alexaUserId ?? '']);
      await AsyncStorage.multiSet(pairs);
    } catch { /* ignore */ }
  },

  async getCommandHistory(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.COMMAND_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async addCommandToHistory(command: string): Promise<void> {
    try {
      const history = await Storage.getCommandHistory();
      const updated = [command, ...history.filter(c => c !== command)].slice(0, 20);
      await AsyncStorage.setItem(KEYS.COMMAND_HISTORY, JSON.stringify(updated));
    } catch { /* ignore */ }
  },

  async clearHistory(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.COMMAND_HISTORY);
  },

  async getRecentHosts(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.RECENT_HOSTS);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  async addRecentHost(host: string): Promise<void> {
    try {
      const hosts = await Storage.getRecentHosts();
      const updated = [host, ...hosts.filter(h => h !== host)].slice(0, 5);
      await AsyncStorage.setItem(KEYS.RECENT_HOSTS, JSON.stringify(updated));
    } catch { /* ignore */ }
  },
};
