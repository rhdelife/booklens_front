/**
 * Form Validation 유틸리티 함수
 */

/**
 * 이메일 형식 검증
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: '이메일을 입력해주세요.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: '올바른 이메일 형식이 아닙니다.' }
  }

  return { isValid: true, error: null }
}

/**
 * 비밀번호 검증
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecialChar = false,
  } = options

  if (!password || password.trim() === '') {
    return { isValid: false, error: '비밀번호를 입력해주세요.' }
  }

  if (password.length < minLength) {
    return { isValid: false, error: `비밀번호는 최소 ${minLength}자 이상이어야 합니다.` }
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: '비밀번호에 대문자가 포함되어야 합니다.' }
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: '비밀번호에 소문자가 포함되어야 합니다.' }
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    return { isValid: false, error: '비밀번호에 숫자가 포함되어야 합니다.' }
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: '비밀번호에 특수문자가 포함되어야 합니다.' }
  }

  return { isValid: true, error: null }
}

/**
 * 비밀번호 확인 검증
 */
export const validatePasswordConfirm = (password, passwordConfirm) => {
  if (!passwordConfirm || passwordConfirm.trim() === '') {
    return { isValid: false, error: '비밀번호 확인을 입력해주세요.' }
  }

  if (password !== passwordConfirm) {
    return { isValid: false, error: '비밀번호가 일치하지 않습니다.' }
  }

  return { isValid: true, error: null }
}

/**
 * 필수 필드 검증
 */
export const validateRequired = (value, fieldName = '필드') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, error: `${fieldName}을(를) 입력해주세요.` }
  }

  return { isValid: true, error: null }
}

/**
 * 문자열 길이 검증
 */
export const validateLength = (value, min = 0, max = Infinity, fieldName = '필드') => {
  if (!value) {
    return { isValid: false, error: `${fieldName}을(를) 입력해주세요.` }
  }

  const length = value.trim().length

  if (length < min) {
    return { isValid: false, error: `${fieldName}은(는) 최소 ${min}자 이상이어야 합니다.` }
  }

  if (length > max) {
    return { isValid: false, error: `${fieldName}은(는) 최대 ${max}자까지 입력 가능합니다.` }
  }

  return { isValid: true, error: null }
}

/**
 * 숫자 범위 검증
 */
export const validateNumberRange = (value, min = -Infinity, max = Infinity, fieldName = '필드') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName}을(를) 입력해주세요.` }
  }

  const num = Number(value)

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName}은(는) 숫자여야 합니다.` }
  }

  if (num < min) {
    return { isValid: false, error: `${fieldName}은(는) ${min} 이상이어야 합니다.` }
  }

  if (num > max) {
    return { isValid: false, error: `${fieldName}은(는) ${max} 이하여야 합니다.` }
  }

  return { isValid: true, error: null }
}

/**
 * ISBN 검증
 */
export const validateISBN = (isbn) => {
  if (!isbn || isbn.trim() === '') {
    return { isValid: false, error: 'ISBN을 입력해주세요.' }
  }

  // 하이픈 제거
  const cleanISBN = isbn.replace(/-/g, '')

  // ISBN-10 또는 ISBN-13 형식 확인
  const isbn10Regex = /^[0-9]{10}$/
  const isbn13Regex = /^[0-9]{13}$/

  if (!isbn10Regex.test(cleanISBN) && !isbn13Regex.test(cleanISBN)) {
    return { isValid: false, error: '올바른 ISBN 형식이 아닙니다. (10자리 또는 13자리 숫자)' }
  }

  return { isValid: true, error: null }
}

/**
 * URL 검증
 */
export const validateURL = (url) => {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL을 입력해주세요.' }
  }

  try {
    new URL(url)
    return { isValid: true, error: null }
  } catch {
    return { isValid: false, error: '올바른 URL 형식이 아닙니다.' }
  }
}

/**
 * 날짜 검증
 */
export const validateDate = (date, fieldName = '날짜') => {
  if (!date || date.trim() === '') {
    return { isValid: false, error: `${fieldName}을(를) 선택해주세요.` }
  }

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: '올바른 날짜 형식이 아닙니다.' }
  }

  return { isValid: true, error: null }
}

/**
 * 평점 검증 (1-5)
 */
export const validateRating = (rating) => {
  return validateNumberRange(rating, 1, 5, '평점')
}

/**
 * 이름/닉네임 검증
 */
export const validateName = (name) => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: '이름을 입력해주세요.' }
  }

  const trimmedName = name.trim()
  if (trimmedName.length < 2) {
    return { isValid: false, error: '이름은 최소 2자 이상이어야 합니다.' }
  }

  if (trimmedName.length > 20) {
    return { isValid: false, error: '이름은 최대 20자까지 입력 가능합니다.' }
  }

  // 특수문자 제한 (한글, 영문, 숫자, 공백만 허용)
  const nameRegex = /^[가-힣a-zA-Z0-9\s]+$/
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: '이름은 한글, 영문, 숫자만 사용 가능합니다.' }
  }

  return { isValid: true, error: null }
}

/**
 * 여러 필드 검증 (객체 형태)
 */
export const validateForm = (formData, validationRules) => {
  const errors = {}
  let isValid = true

  Object.keys(validationRules).forEach((field) => {
    const rules = validationRules[field]
    const value = formData[field]

    // 각 규칙을 순차적으로 검증
    for (const rule of rules) {
      const result = rule(value, formData)
      if (!result.isValid) {
        errors[field] = result.error
        isValid = false
        break // 첫 번째 에러만 저장
      }
    }
  })

  return { isValid, errors }
}

/**
 * 실시간 검증을 위한 훅 스타일 유틸리티
 */
export const createValidator = (rules) => {
  return (formData) => {
    return validateForm(formData, rules)
  }
}




