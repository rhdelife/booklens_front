import { useState } from 'react'
import { PERSONAS } from '../utils/readingPersona'

/**
 * Reading Persona Badge 컴포넌트
 * 사용자의 독서 페르소나를 표시합니다.
 */
const ReadingPersonaBadge = ({ persona, size = 'md' }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!persona) {
    return null
  }

  // 페르소나 객체가 id만 있는 경우 전체 정보 가져오기
  const personaData = typeof persona === 'string' 
    ? PERSONAS[persona] 
    : (PERSONAS[persona.id] || persona)

  if (!personaData) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    gold: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  return (
    <div className="relative inline-block">
      <div
        className={`
          inline-flex items-center gap-1.5 rounded-lg border font-medium
          ${sizeClasses[size]}
          ${colorClasses[personaData.color] || colorClasses.gray}
          transition-all duration-200
          cursor-help
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className={iconSizes[size]}>{personaData.icon}</span>
        <span>{personaData.name}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            {personaData.description}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReadingPersonaBadge

