/**
 * API 설정 유틸리티
 * 환경 변수 또는 동적으로 API URL 결정
 */

export const getApiBaseUrl = () => {
  // 로컬 개발 환경에서는 항상 localhost 사용 (환경 변수 무시)
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api'
  }

  // 환경 변수가 설정되어 있으면 사용
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // 프로덕션 환경에서는 환경 변수 필수
  if (import.meta.env.PROD) {
    const errorMessage =
      '❌ VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다!\n\n' +
      '프로덕션 환경에서는 백엔드 API URL을 환경 변수로 설정해야 합니다.\n' +
      'Render 환경 변수에 VITE_API_BASE_URL을 추가해주세요.\n\n' +
      '예: https://booklens2-backend.onrender.com/api'

    // 콘솔에 명확한 에러 표시
    console.error(errorMessage)

    // 빈 문자열 반환 (API 요청 시 명확한 에러 메시지 표시)
    // 앱은 시작되지만 API 요청은 실패하고 명확한 에러 메시지 표시
    return ''
  }

  // 개발 환경에서만 로컬호스트 사용
  // 백엔드 서버가 localhost:3000에서 실행 중이어야 함
  return 'http://localhost:3000/api'
}

// API_BASE_URL을 lazy하게 가져오기 (에러 표시를 위해)
let _apiBaseUrl = null
export const API_BASE_URL = (() => {
  if (_apiBaseUrl === null) {
    _apiBaseUrl = getApiBaseUrl()

    // 디버깅: 현재 환경과 API URL 로깅
    console.log('🔧 API Configuration:', {
      mode: import.meta.env.MODE,
      isProd: import.meta.env.PROD,
      envVar: import.meta.env.VITE_API_BASE_URL || 'not set',
      resolvedUrl: _apiBaseUrl,
    })

    // 프로덕션에서 환경 변수가 없으면 경고
    if (import.meta.env.PROD && !_apiBaseUrl) {
      console.error(
        '⚠️ API 요청이 실패할 수 있습니다. ' +
        'Render 환경 변수에 VITE_API_BASE_URL을 설정해주세요.'
      )
    }
  }
  return _apiBaseUrl
})()
