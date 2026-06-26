import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RemoteScreen } from '../screens/RemoteScreen';
import { FireTVScreen } from '../screens/FireTVScreen';
import { SmartHomeScreen } from '../screens/SmartHomeScreen';
import { MacrosScreen } from '../screens/MacrosScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Colors } from '../utils/colors';
import { isTablet } from '../utils/responsive';

const Tab = createBottomTabNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.amazonDark,
    card: Colors.amazonNavy,
    text: Colors.white,
    border: Colors.border,
    primary: Colors.alexaBlue,
    notification: Colors.alexaBlue,
  },
};

const TABS = [
  { name: 'Remote', component: RemoteScreen, icon: 'remote', iconOff: 'remote-off', color: Colors.alexaBlue },
  { name: 'Fire TV', component: FireTVScreen, icon: 'television-play', iconOff: 'television', color: '#AA44FF' },
  { name: 'Smart Home', component: SmartHomeScreen, icon: 'home-automation', iconOff: 'home-outline', color: '#00E676' },
  { name: 'Macros', component: MacrosScreen, icon: 'lightning-bolt', iconOff: 'lightning-bolt-outline', color: '#FFB300' },
  { name: 'Settings', component: SettingsScreen, icon: 'cog', iconOff: 'cog-outline', color: Colors.gray },
];

export function AppNavigator() {
  return (
    <NavigationContainer theme={NAV_THEME}>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TABS.find(t => t.name === route.name);
          return {
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: tab?.color ?? Colors.alexaBlue,
            tabBarInactiveTintColor: Colors.gray,
            tabBarLabelStyle: styles.tabLabel,
            tabBarHideOnKeyboard: true,
            tabBarIcon: ({ color, size, focused }) => {
              const iconName = focused ? (tab?.icon ?? 'circle') : (tab?.iconOff ?? 'circle-outline');
              return (
                <View style={focused ? [styles.activeIconBg, { backgroundColor: `${tab?.color ?? Colors.alexaBlue}22` }] : undefined}>
                  <MaterialCommunityIcons name={iconName as never} size={size} color={color} />
                </View>
              );
            },
          };
        }}
      >
        {TABS.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{ tabBarLabel: tab.name }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.amazonNavy,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? (isTablet ? 80 : 85) : 62,
    paddingBottom: Platform.OS === 'ios' ? (isTablet ? 16 : 28) : 8,
    paddingTop: 6,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: isTablet ? 11 : 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeIconBg: {
    borderRadius: 10,
    padding: 3,
  },
});
