import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Ballot from './pages/Ballot'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'
import Films from './pages/Films'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!user || !isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ballot" element={<ProtectedRoute><Ballot /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/films" element={<ProtectedRoute><Films /></ProtectedRoute>} />
          <Route path="/groups" element={
            <ProtectedRoute>
              <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <div className="deco-divider mb-6">
                  <span className="text-gold/50 text-xs">★</span>
                </div>
                <h2 className="text-3xl font-display text-gold-gradient mb-4">Groups</h2>
                <p className="text-cream/30 font-body">Coming soon — compete with friends in private groups.</p>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
