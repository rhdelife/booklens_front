import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDarkMode } from '../contexts/DarkModeContext'
import ProfileModal from './ProfileModal'
import DefaultProfileIcon from './DefaultProfileIcon'
import TextPressure from './TextPressure'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { isDark, toggleDarkMode } = useDarkMode()
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
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#29303A]/80 backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center cursor-pointer">
              <div className="h-8 w-32">
                <TextPressure
                  text="BookLens"
                  textColor={isDark ? "#F9FAFB" : "#1F2937"}
                  width={true}
                  weight={true}
                  italic={true}
                  className="flex"
                  minFontSize={20}
                />
              </div>
            </Link>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-[15px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-normal"
              >
                Home
              </Link>
              <Link
                to="/mylibrary"
                className="text-[15px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-normal"
              >
                Library
              </Link>
              <Link
                to="/community"
                className="text-[15px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-normal"
              >
                Community
              </Link>
              <Link
                to="/recommend"
                className="text-[15px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-normal"
              >
                Recommend
              </Link>
            </div>

            {/* User Profile / Login */}
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div
                      onClick={() => setShowProfileModal(true)}
                      className="cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                    >
                      <DefaultProfileIcon
                        size={36}
                        name={user?.nickname || user?.name || user?.email}
                        className="border-2 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-gray-700 dark:text-gray-300 text-sm font-normal">
                        {user?.nickname || user?.name || user?.email}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm font-normal transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-2.5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
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


