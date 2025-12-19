import { useState, useEffect } from 'react'
import { getReadingHistoryByDate } from '../utils/readingHistory'

/**
 * 날짜별 독서 상세 정보 모달
 */
const ReadingDateDetailModal = ({ isOpen, date, readingData: initialData, onClose }) => {
  const [readingData, setReadingData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)

  // 날짜가 변경되면 백엔드에서 데이터 로드
  useEffect(() => {
    if (isOpen && date) {
      const loadData = async () => {
        setIsLoading(true)
        try {
          // initialData가 있으면 사용, 없으면 백엔드에서 조회
          if (initialData) {
            setReadingData(initialData)
          } else {
            const data = await getReadingHistoryByDate(date)
            setReadingData(data)
          }
        } catch (error) {
          console.error('Failed to load reading data:', error)
        } finally {
          setIsLoading(false)
        }
      }
      loadData()
    }
  }, [isOpen, date, initialData])

  if (!isOpen || !date) return null

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '0분'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    } else {
      return `${minutes}분`
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    return `${month}월 ${day}일 (${weekDay})`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full border border-gray-100 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            {formatDate(date)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
            </div>
          ) : !readingData || !readingData.sessions || readingData.sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">해당 날짜에 독서 기록이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 총 독서 시간 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">총 독서 시간</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {formatTime(readingData.totalTime || 0)}
                </div>
              </div>

              {/* 독서 세션 목록 */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">읽은 책</h3>
                <div className="space-y-3">
                  {readingData.sessions.map((session, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {session.bookThumbnail && (
                      <img
                        src={session.bookThumbnail}
                        alt={session.bookTitle}
                        className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                        {session.bookTitle}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">{session.bookAuthor}</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        {session.pagesRead > 0 && (
                          <div>
                            읽은 페이지: <span className="font-medium">{session.pagesRead}페이지</span>
                          </div>
                        )}
                        <div>
                          독서 시간: <span className="font-medium">{formatTime(session.duration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReadingDateDetailModal

