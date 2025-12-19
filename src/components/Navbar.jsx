import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProfileModal from './ProfileModal'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <style>{`
        @font-face {
          font-family: 'Compressa VF';
          src: url('https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2');
          font-style: normal;
        }
        .logo-compressa {
          font-family: 'Compressa VF', sans-serif;
          text-transform: uppercase;
          font-weight: 300;
        }
      `}</style>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">BookLens</h1>
            </Link>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-normal"
              >
                Home
              </Link>
              <Link
                to="/mylibrary"
                className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-normal"
              >
                Library
              </Link>
              <Link
                to="/community"
                className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-normal"
              >
                Community
              </Link>
              <Link
                to="/recommend"
                className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-normal"
              >
                Recommend
              </Link>
            </div>

            {/* User Profile / Login */}
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3">
                    <img
                      src={user?.profile_image_url || '/midoriya.jpg'}
                      alt="Profile"
                      onClick={() => setShowProfileModal(true)}
                      className="w-9 h-9 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200"
                      onError={(e) => {
                        e.target.src = '/midoriya.jpg'
                      }}
                    />
                    <div className="hidden sm:block">
                      <span className="text-gray-700 text-sm font-normal">
                        {user?.nickname || user?.name || user?.email}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 text-sm font-normal transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />
    </>
  )
}

export default Navbar


