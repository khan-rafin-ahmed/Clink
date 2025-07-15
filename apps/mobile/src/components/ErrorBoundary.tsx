import React, { Component, ReactNode } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#08090A',
          padding: 20 
        }}>
          <Text style={{ 
            color: '#FF5F2E', 
            fontSize: 20, 
            fontWeight: 'bold',
            marginBottom: 16 
          }}>
            Something went wrong
          </Text>
          
          <Text style={{ 
            color: '#FFFFFF', 
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 20
          }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          
          <TouchableOpacity
            onPress={this.handleReset}
            style={{
              backgroundColor: '#00FFA3',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8
            }}
          >
            <Text style={{ 
              color: '#08090A', 
              fontWeight: 'bold' 
            }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}
