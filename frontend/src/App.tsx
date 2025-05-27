import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { UserProfile } from './pages/UserProfile'
import { EditProfile } from './pages/EditProfile'
import { ProfileTest } from './pages/ProfileTest'
import { MySessions } from './pages/MySessions'
import { Events } from './pages/Events'
import { Discover } from './pages/Discover'
import { Profile } from './pages/Profile'
import { EventDetails } from './pages/EventDetails'
import { EventDetail } from './pages/EventDetail'
import { AuthCallback } from './pages/AuthCallback'
import { TestAuth } from './pages/TestAuth'
import { OAuthTest } from './pages/OAuthTest'
import { ConfigChecker } from './pages/ConfigChecker'
import { DatabaseChecker } from './pages/DatabaseChecker'
import { ShareTest } from './pages/ShareTest'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Suspense } from 'react'
import { LoadingSpinner } from './components/LoadingSpinner'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <Router>
          <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />
            <main className="flex-1">
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner size="lg" text="Loading page..." showLogo />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                    <Route path="/my-sessions" element={<MySessions />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/discover" element={<Discover />} />
                    <Route path="/events/:eventId" element={<EventDetails />} />
                    <Route path="/event/:eventCode" element={<EventDetail />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/test-auth" element={<TestAuth />} />
                    <Route path="/oauth-test" element={<OAuthTest />} />
                    <Route path="/config-check" element={<ConfigChecker />} />
                    <Route path="/db-check" element={<DatabaseChecker />} />
                    <Route path="/profile-test" element={<ProfileTest />} />
                    <Route path="/share-test" element={<ShareTest />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <footer className="bg-card border-t border-border py-6 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-sm text-muted-foreground">
                  © 2025 Thirstee. Built by Roughin while drinking beers and raising hell. 🤘
                </p>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
