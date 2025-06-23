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
import { NotificationTest } from './test/NotificationTest'
import { DebugUserSearch } from './pages/DebugUserSearch'
import { TestMetaTags } from './pages/TestMetaTags'
import { TestEmailSystem } from './pages/TestEmailSystem'
import { EmailDebugPage } from './pages/EmailDebugPage'
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
          <Toaster
            theme="dark"
            position="top-right"
            expand={true}
            richColors={false}
            closeButton={true}
            duration={5000}
          />
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

              {/* Test route for notification system */}
              <Route path="/test-notifications" element={<NotificationTest />} />

              {/* Debug route for user search issues */}
              <Route path="/debug-user-search" element={<DebugUserSearch />} />

              {/* Test route for meta tags */}
              <Route path="/test-meta-tags" element={<TestMetaTags />} />

              {/* Test route for email system */}
              <Route path="/test-email-system" element={<TestEmailSystem />} />

              {/* Debug route for email system */}
              <Route path="/debug-email" element={<EmailDebugPage />} />
            </Routes>
          </main>
          <footer className="glass-nav border-t border-white/10 py-8 mt-auto relative">
            {/* Glass overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <p className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
                © 2025 Thirstee. Built by Roughin while drinking beers and raising hell 🍺🤘
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
