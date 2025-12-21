/**
 * 백엔드 API 연동을 위한 서비스 레이어
 * 환경 변수에서 API URL을 가져오거나 동적으로 결정
 */

import { API_BASE_URL } from '../utils/apiConfig'

/**
 * 지연 함수 (재시도용)
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 재시도 가능한 오류인지 확인
 */
const isRetryableError = (error, response) => {
  // 네트워크 오류
  if (error && error.name === 'TypeError' && error.message.includes('fetch')) {
    return true
  }
  
  // 서버 오류 (5xx)
  if (response && response.status >= 500) {
    return true
  }
  
  // 데이터베이스 연결 오류 (백엔드에서 반환하는 경우)
  if (error && error.message) {
    const dbErrorKeywords = [
      'database',
      'connection',
      'timeout',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'PrismaClientInitializationError',
      "Can't reach database server"
    ]
    return dbErrorKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword.toLowerCase())
    )
  }
  
  return false
}

/**
 * API 요청 헬퍼 함수 (재시도 로직 포함)
 */
const apiRequest = async (endpoint, options = {}, retryCount = 0) => {
  const MAX_RETRIES = 3
  const INITIAL_DELAY = 1000 // 1초
  
  // API_BASE_URL이 설정되지 않았으면 명확한 에러
  if (!API_BASE_URL) {
    const errorMessage =
      '백엔드 API URL이 설정되지 않았습니다.\n\n' +
      'Render 환경 변수에 VITE_API_BASE_URL을 설정해주세요.\n' +
      '예: https://booklens2-backend.onrender.com/api'
    console.error(errorMessage)
    throw new Error('백엔드 서버 URL이 설정되지 않았습니다. 환경 변수 VITE_API_BASE_URL을 확인해주세요.')
  }

  const url = `${API_BASE_URL}${endpoint}`

  // 세션에서 토큰 가져오기
  const token = sessionStorage.getItem('token')

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  // 토큰이 있으면 Authorization 헤더 추가
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      // 에러 응답 처리 (백엔드가 { error: string } 형식 사용)
      let errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`
      
      // 백엔드에서 반환하는 에러 객체에서 메시지 추출
      if (typeof data === 'object' && data.error) {
        if (typeof data.error === 'string') {
          errorMessage = data.error
        } else if (data.error.message) {
          errorMessage = data.error.message
        }
      }
      
      // 데이터베이스 연결 오류 메시지 정규화
      if (errorMessage.includes("Can't reach database server") || 
          errorMessage.includes('P1001') ||
          errorMessage.includes('PrismaClient')) {
        errorMessage = '데이터베이스 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }
      
      const error = new Error(errorMessage)
      
      // 재시도 가능한 오류이고 재시도 횟수가 남아있으면 재시도
      if (isRetryableError(error, response) && retryCount < MAX_RETRIES) {
        const delayMs = INITIAL_DELAY * Math.pow(2, retryCount) // Exponential backoff
        console.warn(`API 요청 실패 (재시도 ${retryCount + 1}/${MAX_RETRIES}):`, {
          url,
          status: response.status,
          error: errorMessage,
          retryIn: `${delayMs}ms`
        })
        await delay(delayMs)
        return apiRequest(endpoint, options, retryCount + 1)
      }
      
      console.error('API Error Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        data,
        retryCount,
      })
      throw error
    }

    return data
  } catch (error) {
    // 네트워크 에러나 기타 에러 처리
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // 재시도 가능한 네트워크 오류
      if (retryCount < MAX_RETRIES) {
        const delayMs = INITIAL_DELAY * Math.pow(2, retryCount)
        console.warn(`네트워크 오류 (재시도 ${retryCount + 1}/${MAX_RETRIES}):`, {
          url,
          error: error.message,
          retryIn: `${delayMs}ms`
        })
        await delay(delayMs)
        return apiRequest(endpoint, options, retryCount + 1)
      }
      
      console.error('Network Error - 백엔드 서버에 연결할 수 없습니다:', {
        url,
        error: error.message,
        hint: '백엔드 서버가 실행 중인지 확인하세요. API_BASE_URL: ' + API_BASE_URL,
        retryCount,
      })
      throw new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    }
    
    // 데이터베이스 연결 오류 감지
    if (isRetryableError(error) && retryCount < MAX_RETRIES) {
      const delayMs = INITIAL_DELAY * Math.pow(2, retryCount)
      console.warn(`일시적 오류 감지 (재시도 ${retryCount + 1}/${MAX_RETRIES}):`, {
        url,
        error: error.message,
        retryIn: `${delayMs}ms`
      })
      await delay(delayMs)
      return apiRequest(endpoint, options, retryCount + 1)
    }
    
    console.error('API Request Error:', {
      url,
      error: error.message,
      stack: error.stack,
      retryCount,
    })
    throw error
  }
}

/**
 * 인증 관련 API
 */
export const authAPI = {
  // 로그인
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  // 회원가입
  signup: async (email, password, name) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  },

  // 로그아웃
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    })
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser: async () => {
    return apiRequest('/auth/me')
  },

  // 프로필 업데이트
  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  },

  // 프로필 이미지 업로드
  uploadProfileImage: async (imageData) => {
    return apiRequest('/auth/profile/image', {
      method: 'POST',
      body: JSON.stringify({ image: imageData }),
    })
  },

  // 구글 OAuth 콜백
  googleCallback: async (code, state) => {
    return apiRequest('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    })
  },

  // 네이버 OAuth 콜백
  naverCallback: async (code, state) => {
    return apiRequest('/auth/naver/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    })
  },
}

/**
 * 책 관련 API
 */
export const bookAPI = {
  // 내 도서 목록 가져오기
  getMyBooks: async () => {
    return apiRequest('/books')
  },

  // 책 추가
  addBook: async (bookData) => {
    return apiRequest('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    })
  },

  // 책 수정
  updateBook: async (bookId, bookData) => {
    return apiRequest(`/books/${bookId}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    })
  },

  // 책 삭제
  deleteBook: async (bookId) => {
    return apiRequest(`/books/${bookId}`, {
      method: 'DELETE',
    })
  },

  // 책 상세 정보 가져오기
  getBookById: async (bookId) => {
    return apiRequest(`/books/${bookId}`)
  },
}

/**
 * 독서 세션 관련 API
 */
export const readingSessionAPI = {
  // 독서 세션 시작
  startSession: async (bookId) => {
    return apiRequest('/reading-sessions', {
      method: 'POST',
      body: JSON.stringify({ bookId }),
    })
  },

  // 독서 세션 종료
  endSession: async (sessionId, pagesRead) => {
    return apiRequest(`/reading-sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({ pagesRead }),
    })
  },

  // 현재 활성 세션 가져오기
  getActiveSession: async () => {
    return apiRequest('/reading-sessions/active')
  },

  // 독서 세션 저장 (날짜별 기록)
  saveReadingSession: async (sessionData) => {
    return apiRequest('/reading-sessions/save', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    })
  },

  // 달력용 독서 기록 조회
  getCalendarData: async (year, month) => {
    return apiRequest(`/reading-sessions/calendar?year=${year}&month=${month}`)
  },

  // 특정 날짜의 독서 기록 조회
  getDateHistory: async (date) => {
    return apiRequest(`/reading-sessions/date?date=${date}`)
  },
}

/**
 * 포스팅 관련 API
 */
export const postingAPI = {
  // 포스팅 목록 가져오기
  getPostings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/postings?${queryString}` : '/postings'
    return apiRequest(endpoint)
  },

  // 포스팅 작성
  createPosting: async (postingData) => {
    return apiRequest('/postings', {
      method: 'POST',
      body: JSON.stringify(postingData),
    })
  },

  // 포스팅 수정
  updatePosting: async (postingId, postingData) => {
    return apiRequest(`/postings/${postingId}`, {
      method: 'PUT',
      body: JSON.stringify(postingData),
    })
  },

  // 포스팅 삭제
  deletePosting: async (postingId) => {
    return apiRequest(`/postings/${postingId}`, {
      method: 'DELETE',
    })
  },

  // 포스팅 상세 정보 가져오기
  getPostingById: async (postingId) => {
    return apiRequest(`/postings/${postingId}`)
  },
}

/**
 * 좋아요 관련 API
 */
export const likeAPI = {
  // 좋아요 추가/제거
  toggleLike: async (postingId) => {
    return apiRequest(`/postings/${postingId}/like`, {
      method: 'POST',
    })
  },
}

/**
 * 댓글 관련 API
 */
export const commentAPI = {
  // 댓글 작성
  createComment: async (postingId, content) => {
    return apiRequest(`/postings/${postingId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  },

  // 댓글 삭제
  deleteComment: async (commentId) => {
    return apiRequest(`/comments/${commentId}`, {
      method: 'DELETE',
    })
  },
}

/**
 * AI 추천 관련 API
 */
export const aiAPI = {
  /**
   * AI 도서 추천 요청
   * @param {Object} payload - 추천 요청 페이로드
   * @param {'isbn'|'title'} payload.inputType
   * @param {string} payload.query
   * @param {{recentBooks?: Array, preferredGenres?: string[], readingGoal?: string}} payload.userContext
   */
  getRecommendations: async (payload) => {
    return apiRequest('/ai/recommendations', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

export default {
  authAPI,
  bookAPI,
  readingSessionAPI,
  postingAPI,
  likeAPI,
  commentAPI,
  aiAPI,
}


