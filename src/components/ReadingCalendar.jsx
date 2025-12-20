import { useState, useEffect } from 'react'
import { getCalendarHistory } from '../utils/readingHistory'

/**
 * 독서 달력 컴포넌트
 * 날짜별 독서 시간을 표시하고, 날짜 클릭 시 상세 정보를 보여줍니다.
 */
const ReadingCalendar = ({ onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [readingHistory, setReadingHistory] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // 백엔드에서 독서 기록 로드
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      try {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        const history = await getCalendarHistory(year, month)
        setReadingHistory(history)
      } catch (error) {
        console.error('Failed to load reading history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [currentDate])

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 달력 렌더링
  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // 첫 번째 날짜
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    // 이전 달의 마지막 날짜들
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    const days = []

    // 이전 달 날짜들
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonthLastDay - i).toISOString().split('T')[0]
      })
    }

    // 현재 달 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i).toISOString().split('T')[0]
      })
    }

    // 다음 달 날짜들 (달력을 채우기 위해)
    const remainingDays = 42 - days.length // 6주 * 7일
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i).toISOString().split('T')[0]
      })
    }

    return days
  }

  // 날짜별 독서 시간 가져오기 (분 단위)
  const getReadingTimeForDate = (dateString) => {
    const history = readingHistory[dateString]
    if (!history) return 0
    return Math.floor(history.totalTime / 60) // 초를 분으로 변환
  }

  // 날짜별 독서 기록이 있는지 확인
  const hasReadingRecord = (dateString) => {
    return readingHistory[dateString] && readingHistory[dateString].sessions.length > 0
  }

  // 오늘인지 확인
  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  const calendarDays = renderCalendar()
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            오늘
          </button>
          <button
            onClick={goToNextMonth}
            className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dateString = day.fullDate
          const readingTime = getReadingTimeForDate(dateString)
          const hasRecord = hasReadingRecord(dateString)
          const today = isToday(dateString)

          return (
            <button
              key={index}
              onClick={() => {
                if (hasRecord && onDateClick) {
                  onDateClick(dateString, readingHistory[dateString])
                }
              }}
              className={`
                aspect-square p-2 rounded-lg transition-all flex flex-col items-center justify-center
                ${!day.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                ${today ? 'ring-2 ring-gray-900 dark:ring-gray-100' : ''}
                ${hasRecord ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                ${!hasRecord && day.isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : ''}
              `}
            >
              <div className="text-sm font-medium mb-1">{day.date}</div>
              {hasRecord && (
                <div className="text-xs opacity-90">
                  {readingTime > 0 ? `${readingTime}분` : ''}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ReadingCalendar

