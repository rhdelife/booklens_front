/**
 * 임시 인증 서비스 (데이터베이스 없이 로컬 스토리지 사용)
 * API 서버가 없을 때 사용하는 폴백 인증 시스템
 */

const STORAGE_KEY = 'mock_users'
const TOKEN_KEY = 'mock_token'

/**
 * 로컬 스토리지에서 사용자 목록 가져오기
 */
const getUsers = () => {
  try {
    const usersJson = localStorage.getItem(STORAGE_KEY)
    return usersJson ? JSON.parse(usersJson) : []
  } catch (error) {
    console.error('Failed to get users from localStorage:', error)
    return []
  }
}

/**
 * 로컬 스토리지에 사용자 목록 저장
 */
const saveUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.error('Failed to save users to localStorage:', error)
  }
}

/**
 * 간단한 토큰 생성 (실제로는 JWT 등을 사용해야 함)
 */
const generateToken = (email) => {
  return `mock_token_${email}_${Date.now()}`
}

/**
 * 임시 로그인
 */
export const mockLogin = async (email, password) => {
  const users = getUsers()
  const user = users.find((u) => u.email === email)

  if (!user) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  if (user.password !== password) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  const token = generateToken(email)
  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  }

  // 토큰 저장
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(`${TOKEN_KEY}_${token}`, JSON.stringify(userData))

  return {
    user: userData,
    token,
  }
}

/**
 * 임시 회원가입
 */
export const mockSignup = async (email, password, name) => {
  const users = getUsers()

  // 이메일 중복 확인
  if (users.some((u) => u.email === email)) {
    throw new Error('이미 사용 중인 이메일입니다.')
  }

  // 새 사용자 생성
  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    password, // 실제로는 해시해야 하지만 임시이므로 평문 저장
    name,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  saveUsers(users)

  const token = generateToken(email)
  const userData = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    createdAt: newUser.createdAt,
  }

  // 토큰 저장
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(`${TOKEN_KEY}_${token}`, JSON.stringify(userData))

  return {
    user: userData,
    token,
  }
}

/**
 * 토큰으로 사용자 정보 가져오기
 */
export const mockGetCurrentUser = async (token) => {
  if (!token) {
    throw new Error('토큰이 없습니다.')
  }

  const userDataJson = localStorage.getItem(`${TOKEN_KEY}_${token}`)
  if (!userDataJson) {
    throw new Error('유효하지 않은 토큰입니다.')
  }

  try {
    const userData = JSON.parse(userDataJson)
    return { user: userData }
  } catch (error) {
    throw new Error('사용자 정보를 불러올 수 없습니다.')
  }
}

/**
 * 로그아웃 (토큰 제거)
 */
export const mockLogout = async () => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    localStorage.removeItem(`${TOKEN_KEY}_${token}`)
    localStorage.removeItem(TOKEN_KEY)
  }
}

/**
 * API 연결 실패 여부 확인 (간단한 체크)
 * 주의: 이 함수는 실제로 사용되지 않을 수 있습니다.
 * API 실패는 try-catch로 처리됩니다.
 */
export const isApiAvailable = async () => {
  // API_BASE_URL이 설정되어 있고 비어있지 않으면 사용 가능
  try {
    const { API_BASE_URL } = await import('../utils/apiConfig')
    return !!API_BASE_URL && API_BASE_URL.trim() !== ''
  } catch (error) {
    return false
  }
}
