import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import { AppProvider } from './src/context/AppContext';
import { LicenseProvider } from './src/context/LicenseContext';
import { LicenseGate } from './src/screens/LicenseGate';
import { I18nProvider, useTranslation } from './src/i18n';
import { COLORS } from './src/components';

import HomeScreen from './src/screens/HomeScreen';
import StaffScreen from './src/screens/StaffScreen';
import IngredientsScreen from './src/screens/IngredientsScreen';
import OverheadScreen from './src/screens/OverheadScreen';
import DishesScreen from './src/screens/DishesScreen';
import CalculatorScreen from './src/screens/CalculatorScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Home: '🏠',
  Staff: '👥',
  Ingredients: '🥕',
  Overhead: '⚡',
  Dishes: '🍽️',
};

function TabNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICONS[route.name] || '●'}
          </Text>
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home"        component={HomeScreen}        options={{ tabBarLabel: t('tabs.overview') }} />
      <Tab.Screen name="Ingredients" component={IngredientsScreen} options={{ tabBarLabel: t('tabs.ingredients') }} />
      <Tab.Screen name="Staff"       component={StaffScreen}       options={{ tabBarLabel: t('tabs.staff') }} />
      <Tab.Screen name="Overhead"    component={OverheadScreen}    options={{ tabBarLabel: t('tabs.overhead') }} />
      <Tab.Screen name="Dishes"      component={DishesScreen}      options={{ tabBarLabel: t('tabs.dishes') }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={{
          headerShown: true,
          title: 'Menu Pricing',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
      <LicenseProvider>
        <LicenseGate>
          <AppProvider>
            <NavigationContainer>
              <StatusBar style="light" backgroundColor={COLORS.primary} />
              <RootNavigator />
            </NavigationContainer>
          </AppProvider>
        </LicenseGate>
      </LicenseProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
