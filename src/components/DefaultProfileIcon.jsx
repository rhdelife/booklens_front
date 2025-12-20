/**
 * 기본 프로필 아이콘 컴포넌트
 * 검은색 원형 배경에 사용자 이니셜을 표시
 */
const DefaultProfileIcon = ({ size = 32, name, className = '' }) => {
  // Tailwind 클래스 매핑
  const sizeClass = size === 36 ? 'w-9 h-9' : size === 128 ? 'w-32 h-32' : 'w-8 h-8'
  const textSizeClass = size === 36 ? 'text-sm' : size === 128 ? 'text-4xl' : 'text-sm'
  
  // 이름에서 이니셜 추출
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const initials = getInitials(name)

  return (
    <div
      className={`${sizeClass} ${className} rounded-full bg-gray-900 flex items-center justify-center text-white font-medium ${textSizeClass} leading-none`}
    >
      <span className="flex items-center justify-center">{initials}</span>
    </div>
  )
}

export default DefaultProfileIcon

