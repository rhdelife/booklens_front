import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import {
  supabaseLogin,
  supabaseSignup,
  supabaseGetCurrentUser,
  supabaseLogout,
  supabaseGetSession,
  supabaseOnAuthStateChange,
} from '../services/supabaseAuth'
import {
  mockLogin,
  mockSignup,
  mockGetCurrentUser,
  mockLogout,
} from '../services/mockAuth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 세션에서 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        // 1. Supabase 세션 확인 (우선)
        try {
          const session = await supabaseGetSession()
          if (session?.user) {
            const currentUser = await supabaseGetCurrentUser()
            setUser(currentUser.user)
            // 세션 스토리지에 저장
            sessionStorage.setItem('user', JSON.stringify(currentUser.user))
            if (session.access_token) {
              sessionStorage.setItem('token', session.access_token)
            }
            setLoading(false)
            return
          }
        } catch (supabaseError) {
          console.warn('Supabase 세션 확인 실패:', supabaseError.message)
        }

        // 2. 기존 세션 스토리지 확인
        const sessionUser = sessionStorage.getItem('user')
        const token = sessionStorage.getItem('token')

        if (sessionUser && token) {
          try {
            const userData = JSON.parse(sessionUser)
            // API 서버에서 사용자 정보 확인
            try {
              const currentUser = await authAPI.getCurrentUser()
              setUser(currentUser.user)
            } catch (error) {
              // API 실패 시 임시 인증으로 폴백
              console.warn('API 서버 연결 실패, 임시 인증 모드로 전환:', error.message)
              try {
                const mockUser = await mockGetCurrentUser(token)
                setUser(mockUser.user)
                sessionStorage.setItem('user', JSON.stringify(mockUser.user))
              } catch (mockError) {
                // 모든 인증 방법 실패 시 세션 초기화
                console.error('Failed to verify user:', mockError)
                sessionStorage.removeItem('user')
                sessionStorage.removeItem('token')
                setUser(null)
              }
            }
          } catch (error) {
            console.error('Failed to parse user session:', error)
            sessionStorage.removeItem('user')
            sessionStorage.removeItem('token')
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    // Supabase 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabaseOnAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth state changed:', event, session?.user?.email)
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const currentUser = await supabaseGetCurrentUser()
            setUser(currentUser.user)
            sessionStorage.setItem('user', JSON.stringify(currentUser.user))
            if (session.access_token) {
              sessionStorage.setItem('token', session.access_token)
            }
          } catch (error) {
            console.error('Failed to get user after sign in:', error)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          sessionStorage.removeItem('user')
          sessionStorage.removeItem('token')
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // 로그인 함수
  const login = async (email, password) => {
    // 1. Supabase 로그인 시도 (우선)
    try {
      const response = await supabaseLogin(email, password)
      const { user: userData, token } = response

      sessionStorage.setItem('user', JSON.stringify(userData))
      if (token) {
        sessionStorage.setItem('token', token)
      }
      setUser(userData)
      console.log('✅ Supabase 로그인 성공')
      return userData
    } catch (supabaseError) {
      console.warn('Supabase 로그인 실패:', supabaseError.message)

      // 2. 기존 API 서버 시도
      try {
        const response = await authAPI.login(email, password)
        const { user: userData, token } = response

        sessionStorage.setItem('user', JSON.stringify(userData))
        if (token) {
          sessionStorage.setItem('token', token)
        }
        setUser(userData)
        return userData
      } catch (apiError) {
        console.warn('API 서버 연결 실패:', apiError.message)

        // 3. 임시 인증으로 폴백
        try {
          const response = await mockLogin(email, password)
          const { user: userData, token } = response

          sessionStorage.setItem('user', JSON.stringify(userData))
          if (token) {
            sessionStorage.setItem('token', token)
          }
          setUser(userData)
          console.log('✅ 임시 인증 모드로 로그인 성공')
          return userData
        } catch (mockError) {
          throw new Error(mockError.message || '로그인에 실패했습니다.')
        }
      }
    }
  }

  // 회원가입 함수
  const signup = async (email, password, name) => {
    // 1. Supabase 회원가입 시도 (우선)
    try {
      const response = await supabaseSignup(email, password, name)
      const { user: userData, token } = response

      sessionStorage.setItem('user', JSON.stringify(userData))
      if (token) {
        sessionStorage.setItem('token', token)
      }
      setUser(userData)
      console.log('✅ Supabase 회원가입 성공')
      return userData
    } catch (supabaseError) {
      console.warn('Supabase 회원가입 실패:', supabaseError.message)

      // 2. 기존 API 서버 시도
      try {
        const response = await authAPI.signup(email, password, name)
        const { user: userData, token } = response

        sessionStorage.setItem('user', JSON.stringify(userData))
        if (token) {
          sessionStorage.setItem('token', token)
        }
        setUser(userData)
        return userData
      } catch (apiError) {
        console.warn('API 서버 연결 실패:', apiError.message)

        // 3. 임시 인증으로 폴백
        try {
          const response = await mockSignup(email, password, name)
          const { user: userData, token } = response

          sessionStorage.setItem('user', JSON.stringify(userData))
          if (token) {
            sessionStorage.setItem('token', token)
          }
          setUser(userData)
          console.log('✅ 임시 인증 모드로 회원가입 성공')
          return userData
        } catch (mockError) {
          console.error('Signup error (all methods failed):', mockError)
          throw mockError
        }
      }
    }
  }

  // 로그아웃 함수
  const logout = async () => {
    try {
      // Supabase 로그아웃 시도
      await supabaseLogout()
    } catch (supabaseError) {
      console.warn('Supabase 로그아웃 실패:', supabaseError.message)
      try {
        // 기존 API 서버 로그아웃 시도
        await authAPI.logout()
      } catch (apiError) {
        console.warn('API 서버 연결 실패:', apiError.message)
        try {
          // 임시 인증 로그아웃
          await mockLogout()
        } catch (mockError) {
          console.error('Logout error (all methods failed):', mockError)
        }
      }
    } finally {
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('token')
      setUser(null)
    }
  }

  // OAuth 로그인 함수 (콜백에서 사용)
  const setOAuthUser = async (userData, token) => {
    sessionStorage.setItem('user', JSON.stringify(userData))
    if (token) {
      sessionStorage.setItem('token', token)
    }
    setUser(userData)
    return userData
  }

  // 사용자 정보 업데이트 함수
  const updateUser = (userData) => {
    sessionStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    setOAuthUser,
    updateUser,
    setUser,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}





