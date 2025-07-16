import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '../lib/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { LoadingScreen } from '../screens/LoadingScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { DiscoverScreen } from '../screens/DiscoverScreen'
import { CreateEventScreen } from '../screens/CreateEventScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { EventDetailScreen } from '../screens/EventDetailScreen'
import { CrewDetailScreen } from '../screens/CrewDetailScreen'
import { NotificationsScreen } from '../screens/NotificationsScreen'

export type RootStackParamList = {
  Main: undefined
  EventDetail: { eventId: string }
  CrewDetail: { crewId: string }
  CreateEvent: undefined
  Login: undefined
}

export type TabParamList = {
  Profile: undefined
  Discover: undefined
  Notifications: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function TabNavigator() {
  const { colors } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          } else if (route.name === 'Discover') {
            iconName = focused ? 'search' : 'search-outline'
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline'
          } else {
            iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.accentPrimary,      // WHITE for active tabs
        tabBarInactiveTintColor: colors.textMuted,       // Gray for inactive tabs
        tabBarStyle: {
          backgroundColor: colors.bgBase,                // Dark background
          borderTopColor: colors.borderDefault,         // Subtle border
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.bgBase,                // Dark header
        },
        headerTintColor: colors.textPrimary,             // White text
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  const { isLoading, isAuthenticated, isInitialized } = useAuth()
  const { colors } = useTheme()

  if (!isInitialized || isLoading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bgBase,              // Dark header
        },
        headerTintColor: colors.textPrimary,          // White text
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen 
            name="Main" 
            component={TabNavigator} 
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{ title: 'Event Details' }}
          />
          <Stack.Screen
            name="CrewDetail"
            component={CrewDetailScreen}
            options={{ title: 'Crew Details' }}
          />
          <Stack.Screen
            name="CreateEvent"
            component={CreateEventScreen}
            options={{ title: 'Create Event' }}
          />
        </>
      ) : (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  )
}
