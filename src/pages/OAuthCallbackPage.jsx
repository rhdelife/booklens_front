import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setOAuthUser } = useAuth()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        // 백엔드에서 OAuth 콜백을 처리한 후 프론트엔드로 리다이렉트
        // 백엔드는 URL 파라미터로 토큰이나 에러를 전달할 수 있음

        const token = searchParams.get('token')
        const userParam = searchParams.get('user')
        const errorParam = searchParams.get('error')
        const errorMessage = searchParams.get('message')

        // 에러 처리
        if (errorParam || errorMessage) {
          throw new Error(errorMessage || 'OAuth 인증에 실패했습니다.')
        }

        // 토큰이 있으면 사용자 정보 처리
        if (token) {
          // 토큰을 세션에 저장
          sessionStorage.setItem('token', token)

          // 백엔드에서 user 파라미터로 전달된 사용자 정보가 있으면 사용
          if (userParam) {
            try {
              const userData = JSON.parse(decodeURIComponent(userParam))
              await setOAuthUser(userData, token)
              navigate('/', { replace: true })
              return
            } catch (err) {
              console.error('Failed to parse user data:', err)
              // 파싱 실패 시 백엔드에서 사용자 정보 가져오기
            }
          }

          // user 파라미터가 없거나 파싱 실패 시 백엔드에서 사용자 정보 가져오기
          try {
            const currentUser = await authAPI.getCurrentUser()
            if (currentUser && currentUser.user) {
              await setOAuthUser(currentUser.user, token)
              navigate('/', { replace: true })
              return
            }
          } catch (err) {
            console.error('Failed to get user info:', err)
            throw new Error('사용자 정보를 가져올 수 없습니다.')
          }
        }

        // 토큰이 없으면 백엔드에서 처리 중이거나 에러 발생
        // 백엔드가 세션 쿠키를 사용하는 경우, 사용자 정보를 다시 가져오기 시도
        try {
          const currentUser = await authAPI.getCurrentUser()
          if (currentUser && currentUser.user) {
            await setOAuthUser(currentUser.user, currentUser.token || sessionStorage.getItem('token'))
            navigate('/', { replace: true })
            return
          }
        } catch (err) {
          console.error('Failed to get user info:', err)
        }

        // 토큰도 없고 사용자 정보도 가져올 수 없으면 에러
        throw new Error('OAuth 인증 정보를 받을 수 없습니다.')
      } catch (err) {
        console.error('OAuth callback error:', {
          error: err.message,
          stack: err.stack,
          searchParams: Object.fromEntries(searchParams),
        })

        setError(err.message || 'OAuth 인증에 실패했습니다.')
        setLoading(false)
        // 3초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
      }
    }

    processCallback()
  }, [searchParams, navigate, setOAuthUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#29303A] flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-gray-100 mb-4 flex items-center justify-center"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">로그인 처리 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 실패</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <p className="text-gray-400 text-xs">잠시 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return null
}

export default OAuthCallbackPage



