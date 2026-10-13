import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'echo_relay_token';
let webToken: string | null = null;

// Browser sessions keep the token in memory. Native apps use OS credential
// storage; relay credentials are never put into AsyncStorage or build config.
export const RelayCredentials = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') return webToken;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async saveToken(value: string | null): Promise<void> {
    const token = value?.trim() || null;
    if (Platform.OS === 'web') { webToken = token; return; }
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
