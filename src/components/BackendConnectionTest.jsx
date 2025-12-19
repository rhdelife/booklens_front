import { useState } from 'react'
import { API_BASE_URL } from '../utils/apiConfig'
import { aiAPI } from '../services/api'

/**
 * 백엔드 연동 테스트 컴포넌트
 * 개발 중에만 사용하고, 프로덕션에서는 제거하세요.
 */
const BackendConnectionTest = () => {
  const [testResult, setTestResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const testHealthCheck = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      
      setTestResult({
        success: true,
        message: '✅ 백엔드 서버 연결 성공!',
        data: data,
        status: response.status,
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: '❌ 백엔드 서버 연결 실패',
        error: error.message,
        hint: '백엔드 서버가 http://localhost:3000 에서 실행 중인지 확인하세요.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testAIRecommendation = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const result = await aiAPI.getRecommendations({
        inputType: 'title',
        query: '해리포터',
        userContext: {
          recentBooks: [],
          preferredGenres: ['판타지'],
          readingGoal: '테스트',
        },
      })

      setTestResult({
        success: true,
        message: '✅ AI 추천 API 연결 성공!',
        data: result,
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: '❌ AI 추천 API 연결 실패',
        error: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-20 right-6 z-40 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm">
      <div className="text-xs font-semibold text-gray-900 mb-3">🔧 백엔드 연동 테스트</div>
      
      <div className="mb-2 text-[10px] text-gray-500">
        API URL: {API_BASE_URL || '설정되지 않음'}
      </div>

      <div className="flex flex-col gap-2 mb-3">
        <button
          onClick={testHealthCheck}
          disabled={isLoading}
          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '테스트 중...' : 'Health Check'}
        </button>
        
        <button
          onClick={testAIRecommendation}
          disabled={isLoading}
          className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '테스트 중...' : 'AI 추천 테스트'}
        </button>
      </div>

      {testResult && (
        <div
          className={`p-2 rounded-lg text-xs ${
            testResult.success
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <div className="font-medium mb-1">{testResult.message}</div>
          {testResult.data && (
            <pre className="text-[10px] overflow-auto max-h-32 mt-1">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          )}
          {testResult.error && (
            <div className="text-[10px] mt-1">{testResult.error}</div>
          )}
          {testResult.hint && (
            <div className="text-[10px] mt-1 text-gray-600">{testResult.hint}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default BackendConnectionTest

