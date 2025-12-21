import { useAuth } from '../contexts/AuthContext'

/**
 * Protected Route 컴포넌트
 * 로그인 없이도 모든 기능을 사용할 수 있도록 수정됨
 */
const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth()

  // 로딩 중일 때는 아무것도 렌더링하지 않음
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#29303A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-gray-100 flex items-center justify-center"></div>
      </div>
    )
  }

  // 로그인 없이도 모든 페이지 접근 가능
  return children
}

export default ProtectedRoute




