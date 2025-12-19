import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { FocusSoundProvider } from './contexts/FocusSoundContext'
import ConditionalNavbar from './components/ConditionalNavbar'
import ProtectedRoute from './components/ProtectedRoute'
import FocusSoundFAB from './components/FocusSoundFAB'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import BookDetailPage from './pages/BookDetailPage'
import MapPage from './pages/MapPage'
import MyLibraryPage from './pages/MyLibraryPage'
import PostingPage from './pages/PostingPage'
import CommunityPage from './pages/CommunityPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import RecommendPage from './pages/RecommendPage'
import BackendConnectionTest from './components/BackendConnectionTest'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <FocusSoundProvider>
        <Router>
          <div className="min-h-screen">
            <ConditionalNavbar />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/book/:id" element={<BookDetailPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/recommend" element={<RecommendPage />} />

              {/* OAuth Callback Routes - 백엔드에서 리다이렉트하는 경로 */}
              <Route path="/auth/callback" element={<OAuthCallbackPage />} />
              <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
              <Route path="/auth/naver/callback" element={<OAuthCallbackPage />} />

              {/* Protected Routes - 인증이 필요한 페이지 */}
              <Route
                path="/mylibrary"
                element={
                  <ProtectedRoute>
                    <MyLibraryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/posting"
                element={
                  <ProtectedRoute>
                    <PostingPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <FocusSoundFAB />
            {/* 개발 모드에서만 백엔드 연동 테스트 컴포넌트 표시 */}
            {import.meta.env.DEV && <BackendConnectionTest />}
          </div>
        </Router>
      </FocusSoundProvider>
    </AuthProvider>
  )
}

export default App
