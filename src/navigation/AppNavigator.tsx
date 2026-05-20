import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RemoteScreen } from '../screens/RemoteScreen';
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

export function AppNavigator() {
  return (
    <NavigationContainer theme={NAV_THEME}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.alexaBlue,
          tabBarInactiveTintColor: Colors.gray,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: string;
            if (route.name === 'Remote') {
              iconName = focused ? 'remote' : 'remote-off';
            } else {
              iconName = focused ? 'cog' : 'cog-outline';
            }
            return (
              <View style={focused ? styles.activeIconBg : undefined}>
                <MaterialCommunityIcons name={iconName as never} size={size} color={color} />
              </View>
            );
          },
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen
          name="Remote"
          component={RemoteScreen}
          options={{ tabBarLabel: 'Remote' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarLabel: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.amazonNavy,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? (isTablet ? 80 : 85) : 60,
    paddingBottom: Platform.OS === 'ios' ? (isTablet ? 16 : 28) : 8,
    paddingTop: 6,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: isTablet ? 13 : 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  activeIconBg: {
    backgroundColor: `${Colors.alexaBlue}22`,
    borderRadius: 10,
    padding: 4,
  },
});
