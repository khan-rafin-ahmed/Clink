import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth as useSharedAuth } from '@shared/hooks/useAuth'
import type { AuthState } from '@shared/hooks/useAuth'

interface AuthContextType extends AuthState {
  // Add any mobile-specific auth methods here
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  try {
    const authState = useSharedAuth()

    const value: AuthContextType = {
      ...authState,
      // Add any mobile-specific auth methods here
    }

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    )
  } catch (error) {
    console.error('AuthProvider initialization error:', error)
    throw error
  }
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
