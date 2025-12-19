import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TextPressure from '../components/TextPressure'
import { validateEmail, validatePassword } from '../utils/validation'
import { startGoogleLogin } from '../services/oauth'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // 실시간 검증
  const validateField = (field, value) => {
    let validation = null
    switch (field) {
      case 'email':
        validation = validateEmail(value)
        break
      case 'password':
        validation = validatePassword(value, { minLength: 6 })
        break
      default:
        return
    }

    if (validation && !validation.isValid) {
      setErrors((prev) => ({ ...prev, [field]: validation.error }))
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})

    // 전체 폼 검증
    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password, { minLength: 6 })

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setErrors({
        email: emailValidation.error,
        password: passwordValidation.error,
      })
      return
    }

    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4 my-8">
        <div className="flex justify-center">
          <TextPressure
            text="|BookLens|"
            textColor="#1F2937"
            width={true}
            weight={true}
            italic={true}
            className="flex"
            minFontSize={40}
          />
        </div>
      </div>
      <div className="max-w-md w-full space-y-4">
        {/* Login Card Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center justify-center mb-6">
              <p className="text-gray-600 text-[15px] font-normal">계정에 로그인하세요</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  validateField('email', e.target.value)
                }}
                onBlur={(e) => validateField('email', e.target.value)}
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900 placeholder:text-gray-400 text-sm ${
                  errors.email ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  validateField('password', e.target.value)
                }}
                onBlur={(e) => validateField('password', e.target.value)}
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900 placeholder:text-gray-400 text-sm ${
                  errors.password ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="비밀번호를 입력하세요"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                  로그인 상태 유지
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-normal text-gray-600 hover:text-gray-900 transition-colors">
                  비밀번호 찾기
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-400">또는</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={startGoogleLogin}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 로그인
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="font-medium text-gray-900 hover:text-gray-700 transition-colors">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

