import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { setupSessionRefresh } from './lib/sessionUtils'
import { useEnvironmentValidation } from './lib/envValidator'
import { Navbar } from './components/Navbar'
import { AuthRedirect } from './components/AuthRedirect'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { UserProfile } from './pages/UserProfile'
import { EditProfile } from './pages/EditProfile'
import { Events } from './pages/Events'
import { Discover } from './pages/Discover'
import { PublicProfile } from './pages/PublicProfile'
import { EventDetails } from './pages/EventDetails'
import { EventDetail } from './pages/EventDetail'
import { AuthCallback } from './pages/AuthCallback'
import { CrewJoin } from './pages/CrewJoin'
import { CrewDetail } from './pages/CrewDetail'
import { TestRatings } from './pages/TestRatings'
import { SessionTest } from './pages/SessionTest'
import { AuthSecurityTest } from './pages/AuthSecurityTest'
import { StyleGuide } from './components/StyleGuide'
import { DeleteProfileTest } from './test/DeleteProfileTest'
import { Toaster } from 'sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  // Set up session management for better mobile compatibility
  useEffect(() => {
    const cleanup = setupSessionRefresh()
    return cleanup
  }, [])

  // Validate environment configuration in local development
  useEnvironmentValidation()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
          <Toaster richColors position="top-right" />
          <Router>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
              <Route path="/" element={
                <AuthRedirect>
                  <HomePage />
                </AuthRedirect>
              } />
              <Route path="/login" element={
                <AuthRedirect>
                  <LoginPage />
                </AuthRedirect>
              } />
              <Route path="/auth/callback" element={<AuthCallback />} />

              <Route path="/profile" element={<UserProfile />} />
              <Route path="/profile/edit" element={<EditProfile />} />

              <Route path="/events" element={<Events />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/events/:eventId" element={<EventDetails />} />

              {/* Modern slug-based routing */}
              <Route path="/event/:slug" element={<EventDetail />} />
              <Route path="/private-event/:slug" element={<EventDetail />} />

              <Route path="/profile/:userId" element={<PublicProfile />} />

              <Route path="/crew/join/:inviteCode" element={<CrewJoin />} />
              <Route path="/crew/:crewId" element={<CrewDetail />} />

              {/* Test route for rating components */}
              <Route path="/test-ratings" element={<TestRatings />} />

              {/* Test route for session management */}
              <Route path="/test-sessions" element={<SessionTest />} />

              {/* Test route for authentication security */}
              <Route path="/test-auth-security" element={<AuthSecurityTest />} />

              {/* Style guide for design system */}
              <Route path="/style-guide" element={<StyleGuide />} />

              {/* Test route for delete profile functionality */}
              <Route path="/test-delete-profile" element={<DeleteProfileTest />} />
            </Routes>
          </main>
          <footer className="bg-card border-t border-border py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-sm text-muted-foreground">
                © 2025 Thirstee. Built by Roughin while drinking beers and raising hell 🍺 
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  </QueryClientProvider>
  )
}

export default App
