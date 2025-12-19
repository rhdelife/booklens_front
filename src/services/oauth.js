/**
 * OAuth 서비스
 * 백엔드에서 OAuth 플로우를 처리하므로 프론트엔드는 백엔드 엔드포인트로만 리다이렉트
 */

import { API_BASE_URL } from '../utils/apiConfig'

/**
 * OAuth 로그인 시작 (구글)
 * 백엔드의 OAuth 시작 엔드포인트로 리다이렉트
 */
export const startGoogleLogin = () => {
  try {
    if (!API_BASE_URL) {
      const errorMessage =
        '백엔드 API URL이 설정되지 않았습니다.\n\n' +
        'Render 환경 변수에 VITE_API_BASE_URL을 설정해주세요.\n' +
        '예: https://booklens-server.onrender.com/api'
      alert(errorMessage)
      console.error(errorMessage)
      return
    }

    const oauthUrl = `${API_BASE_URL}/auth/google`

    // 디버깅: 실제 리다이렉트 URL 로깅
    console.log('🔐 Google OAuth 시작:', {
      apiBaseUrl: API_BASE_URL,
      oauthUrl: oauthUrl,
      envVar: import.meta.env.VITE_API_BASE_URL || 'not set',
    })

    // 백엔드에서 OAuth URL을 생성하고 리다이렉트 처리
    // 백엔드는 OAuth 제공자로 리다이렉트하고, 콜백도 백엔드에서 처리
    window.location.href = oauthUrl
  } catch (error) {
    console.error('Google OAuth 시작 실패:', error)
    alert(error.message || 'Google 로그인을 시작할 수 없습니다.')
  }
}

// Naver OAuth는 제거됨 - Google OAuth만 사용

