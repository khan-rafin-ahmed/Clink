import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'
import React, { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NavigationContainer } from '@react-navigation/native'
import { View, Text, ActivityIndicator } from 'react-native'
import * as Linking from 'expo-linking'

import { AuthProvider } from './src/lib/AuthContext'
import { AppNavigator } from './src/navigation/AppNavigator'
import { ErrorBoundary } from './src/components/ErrorBoundary'

// Create a client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08090A' }}>
      <ActivityIndicator size="large" color="#00FFA3" />
      <Text style={{ color: '#FFFFFF', marginTop: 16 }}>Loading Thirstee...</Text>
    </View>
  )
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08090A', padding: 20 }}>
      <Text style={{ color: '#FF5F2E', fontSize: 18, marginBottom: 16 }}>App Error</Text>
      <Text style={{ color: '#FFFFFF', textAlign: 'center' }}>{error}</Text>
    </View>
  )
}

export default function App() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 100)) // Small delay to ensure polyfills are loaded
        setIsReady(true)
      } catch (err: any) {
        setError(err.message || 'Failed to initialize app')
      }
    }

    initializeApp()
  }, [])

  if (error) {
    return <ErrorScreen error={error} />
  }

  if (!isReady) {
    return <LoadingScreen />
  }

  // Enhanced deep linking configuration
  const linking = {
    prefixes: ['thirstee://', 'https://thirstee.app', 'https://www.thirstee.app'],
    config: {
      screens: {
        // Auth flows
        Login: {
          path: 'auth/callback',
          parse: {
            // Handle OAuth callback parameters
            access_token: (token: string) => token,
            refresh_token: (token: string) => token,
            code: (code: string) => code,
          },
        },

        // Main app navigation
        Main: {
          screens: {
            // Tab navigation
            Profile: 'profile',
            Discover: 'discover',
            Notifications: 'notifications',
          },
        },

        // Event deep links
        EventDetail: {
          path: 'event/:eventId',
          parse: {
            eventId: (eventId: string) => eventId,
          },
        },

        // Crew deep links
        CrewDetail: {
          path: 'crew/:crewId',
          parse: {
            crewId: (crewId: string) => crewId,
          },
        },

        // Additional deep link routes
        ProfileView: {
          path: 'profile/:username',
          parse: {
            username: (username: string) => username,
          },
        },

        CrewJoin: {
          path: 'crew/join/:inviteCode',
          parse: {
            inviteCode: (code: string) => code,
          },
        },

        InvitationAction: {
          path: 'invitation/:token',
          parse: {
            token: (token: string) => token,
          },
        },
      },
    },
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NavigationContainer linking={linking}>
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </QueryClientProvider>
        <StatusBar style="light" backgroundColor="#08090A" />
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
