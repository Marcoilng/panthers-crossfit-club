import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors, fontSize } from '../theme/colors';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AddMemberScreen from '../screens/admin/AddMemberScreen';
import ScannerScreen from '../screens/admin/ScannerScreen';
import MembersScreen from '../screens/admin/MembersScreen';
import PaymentsScreen from '../screens/admin/PaymentsScreen';
import ProfileScreen from '../screens/member/ProfileScreen';

// Define theme
const DarkThemeCustom = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

// Stack Navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icon Component
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {name}
    </Text>
  </View>
);

// Auth Stack (Login)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// Admin Stack with Tabs
const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: styles.tabLabel,
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={AdminDashboardScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Members"
      component={MembersScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon name="👥" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Scanner"
      component={ScannerScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon name="📷" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Payments"
      component={PaymentsScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon name="💰" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

// Main Navigator with Stack for modal screens
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // For demo purposes, if no user, show login
  // In production, user would come from Supabase auth
  if (!user) {
    return (
      <NavigationContainer theme={DarkThemeCustom}>
        <AuthStack />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={DarkThemeCustom}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={AdminTabs} />
        <Stack.Screen 
          name="AddMember" 
          component={AddMemberScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen 
          name="MemberDetails" 
          component={ProfileScreen}
          options={{ presentation: 'card' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: fontSize.lg,
    color: colors.text,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: fontSize.xs,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
});

export default AppNavigator;

