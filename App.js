import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
import QuickCostScreen from './src/screens/QuickCostScreen';

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
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            ...(focused ? {
              backgroundColor: 'rgba(230,81,0,0.10)',
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 3,
            } : {}),
          }}>
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>
              {TAB_ICONS[route.name] || '●'}
            </Text>
          </View>
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: '#FFF',
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#E65100',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
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
          headerBackground: () => (
            <LinearGradient
              colors={['#FF7043', '#E64A19', '#BF360C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          ),
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Stack.Screen
        name="QuickCost"
        component={QuickCostScreen}
        options={{
          headerShown: true,
          title: '⚡ Quick Cost',
          headerBackground: () => (
            <LinearGradient
              colors={['#43A047', '#2E7D32', '#1B5E20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          ),
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
