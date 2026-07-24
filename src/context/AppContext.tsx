import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AppSettings, Storage } from '../utils/storage';
import { EchoControlClient, EchoCommand, CommandResult } from '../utils/echoControl';

interface AppContextValue {
  settings: AppSettings;
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
    backendMode: 'skill',
    alexaUserId: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [client, setClient] = useState<EchoControlClient>(
    () => new EchoControlClient({ mode: 'skill' })
  );

  useEffect(() => {
    Storage.getSettings().then(s => {
      setSettings(s);
      setClient(new EchoControlClient({
        ip: s.deviceIp,
        port: s.devicePort,
        mode: s.backendMode,
        alexaUserId: s.alexaUserId,
      }));
    });
    refreshHistory();
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await Storage.saveSettings(patch);
    if (
      patch.deviceIp !== undefined || patch.devicePort !== undefined
      || patch.backendMode !== undefined || patch.alexaUserId !== undefined
    ) {
      setClient(new EchoControlClient({
        ip: next.deviceIp,
        port: next.devicePort,
        mode: next.backendMode,
        alexaUserId: next.alexaUserId,
      }));
    }
  }, [settings]);

  const checkConnection = useCallback(async () => {
    const ok = await client.ping();
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
    const result = await client.sendCommand(cmd, payload);
    setIsConnected(result.success);
    return result;
  }, [client]);

  const sendAlexaText = useCallback(async (text: string): Promise<CommandResult> => {
    const result = await client.sendAlexaText(text);
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
