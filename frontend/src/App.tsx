import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { UserProfile } from './pages/UserProfile'
import { MySessions } from './pages/MySessions'
import { MyEvents } from './pages/MyEvents'
import { Events } from './pages/Events'
import { Profile } from './pages/Profile'
import { EventDetails } from './pages/EventDetails'
import { EventDetail } from './pages/EventDetail'
import { AuthCallback } from './pages/AuthCallback'
import { TestAuth } from './pages/TestAuth'
import { OAuthTest } from './pages/OAuthTest'
import { ConfigChecker } from './pages/ConfigChecker'
import { DatabaseChecker } from './pages/DatabaseChecker'
import { Toaster } from 'sonner'

function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/my-sessions" element={<MySessions />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventId" element={<EventDetails />} />
            <Route path="/event/:eventCode" element={<EventDetail />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/test-auth" element={<TestAuth />} />
            <Route path="/oauth-test" element={<OAuthTest />} />
            <Route path="/config-check" element={<ConfigChecker />} />
            <Route path="/db-check" element={<DatabaseChecker />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
