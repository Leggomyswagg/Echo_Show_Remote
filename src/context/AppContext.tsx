import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppSettings, Storage } from '../utils/storage';
import { EchoControlClient, EchoCommand, CommandResult } from '../utils/echoControl';
import { RelayCredentials } from '../utils/relayCredentials';

interface AppContextValue {
  settings: AppSettings;
  relayToken: string | null;
  updateRelayToken: (token: string | null) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  sendCommand: (cmd: EchoCommand, payload?: Record<string, unknown>) => Promise<CommandResult>;
  sendAlexaText: (text: string) => Promise<CommandResult>;
  isConnected: boolean;
  checkConnection: () => Promise<void>;
  commandHistory: string[];
  refreshHistory: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    backgroundType: 'default',
    backgroundColor: '#131921',
    backgroundImage: null,
    backgroundGradient: ['#131921', '#1A2535'],
    deviceIp: '192.168.1.100',
    devicePort: '8080',
    echoGeneration: 'show10',
    hapticsEnabled: true,
    backendMode: 'local',
    alexaUserId: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [relayToken, setRelayToken] = useState<string | null>(null);
  const settingsRef = useRef(settings);
  const tokenRef = useRef<string | null>(null);
  const [client, setClient] = useState<EchoControlClient>(
    () => new EchoControlClient({ mode: 'local' })
  );
  const clientRef = useRef(client);

  const configureClient = useCallback((s: AppSettings, token: string | null) => {
    const nextClient = new EchoControlClient({
      ip: s.deviceIp, port: s.devicePort, mode: s.backendMode,
      alexaUserId: s.alexaUserId, relayToken: token,
    });
    clientRef.current = nextClient;
    setClient(nextClient);
  }, []);

  useEffect(() => {
    Promise.all([Storage.getSettings(), RelayCredentials.getToken().catch(() => null)]).then(([s, token]) => {
      settingsRef.current = s;
      tokenRef.current = token;
      setSettings(s);
      setRelayToken(token);
      configureClient(s, token);
    });
    refreshHistory();
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    if (
      patch.deviceIp !== undefined || patch.devicePort !== undefined
      || patch.backendMode !== undefined || patch.alexaUserId !== undefined
    ) {
      configureClient(next, tokenRef.current);
    }
    await Storage.saveSettings(patch);
  }, [configureClient]);

  const updateRelayToken = useCallback(async (value: string | null) => {
    const token = value?.trim() || null;
    await RelayCredentials.saveToken(token);
    tokenRef.current = token;
    setRelayToken(token);
    configureClient(settingsRef.current, token);
  }, [configureClient]);

  const checkConnection = useCallback(async () => {
    const ok = await clientRef.current.ping();
    setIsConnected(ok);
  }, [client]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  const sendCommand = useCallback(async (
    cmd: EchoCommand,
    payload?: Record<string, unknown>
  ): Promise<CommandResult> => {
    const result = await clientRef.current.sendCommand(cmd, payload);
    setIsConnected(result.success);
    return result;
  }, [client]);

  const sendAlexaText = useCallback(async (text: string): Promise<CommandResult> => {
    const result = await clientRef.current.sendAlexaText(text);
    if (result.success) {
      await Storage.addCommandToHistory(text);
      await refreshHistory();
    }
    return result;
  }, [client]);

  const refreshHistory = useCallback(async () => {
    const h = await Storage.getCommandHistory();
    setCommandHistory(h);
  }, []);

  return (
    <AppContext.Provider value={{
      settings,
      relayToken,
      updateRelayToken,
      updateSettings,
      sendCommand,
      sendAlexaText,
      isConnected,
      checkConnection,
      commandHistory,
      refreshHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
