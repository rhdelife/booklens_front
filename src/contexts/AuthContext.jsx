import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

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
        // 세션 스토리지 확인
        const sessionUser = sessionStorage.getItem('user')
        const token = sessionStorage.getItem('token')

        if (sessionUser && token) {
          try {
            // 백엔드 API에서 사용자 정보 확인
            const currentUser = await authAPI.getCurrentUser()
            setUser(currentUser.user)
            // 최신 사용자 정보로 세션 스토리지 업데이트
            sessionStorage.setItem('user', JSON.stringify(currentUser.user))
          } catch (error) {
            // API 실패 시 세션 초기화 (토큰이 만료되었거나 유효하지 않음)
            console.warn('사용자 정보 확인 실패, 세션 초기화:', error.message)
            sessionStorage.removeItem('user')
            sessionStorage.removeItem('token')
            setUser(null)
          }
        } else {
          // 세션 정보가 없으면 사용자 없음
          setUser(null)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // 로그인 함수
  const login = async (email, password) => {
    // 백엔드 API만 사용
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
      console.error('로그인 실패:', apiError.message)
      throw apiError
    }
  }

  // 회원가입 함수
  const signup = async (email, password, name) => {
    // 백엔드 API만 사용
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
      console.error('회원가입 실패:', apiError.message)
      throw apiError
    }
  }

  // 로그아웃 함수
  const logout = async () => {
    try {
      // 백엔드 API 로그아웃 시도
      await authAPI.logout()
    } catch (apiError) {
      console.warn('로그아웃 API 호출 실패:', apiError.message)
      // API 실패해도 로컬 세션은 정리
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





