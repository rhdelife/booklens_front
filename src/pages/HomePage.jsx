import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI, bookAPI } from '../services/api'
import ReadingStartModal from '../components/ReadingStartModal'
import ReadingEndModal from '../components/ReadingEndModal'
import Toast from '../components/Toast'
import ReadingCalendar from '../components/ReadingCalendar'
import ReadingDateDetailModal from '../components/ReadingDateDetailModal'
import { saveReadingSession } from '../utils/readingHistory'

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setOAuthUser, isAuthenticated } = useAuth()
  
  // 현재 읽고 있는 책들
  const [readingBooks, setReadingBooks] = useState([])
  const [readingSession, setReadingSession] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showStartModal, setShowStartModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDateData, setSelectedDateData] = useState(null)
  const [showDateDetailModal, setShowDateDetailModal] = useState(false)

  // OAuth 콜백 처리 (백엔드가 홈 페이지로 리다이렉트한 경우)
  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (token && !isAuthenticated) {
      const handleOAuthCallback = async () => {
        try {
          sessionStorage.setItem('token', token)
          const currentUser = await authAPI.getCurrentUser()
          if (currentUser && currentUser.user) {
            await setOAuthUser(currentUser.user, token)
            // URL에서 토큰 파라미터 제거
            setSearchParams({})
          }
        } catch (err) {
          console.error('OAuth callback error:', err)
          setSearchParams({ error: '인증 실패' })
        }
      }
      handleOAuthCallback()
    } else if (error) {
      console.error('OAuth error:', error)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams, setOAuthUser, isAuthenticated])

  // 백엔드 API에서 읽는 중인 책들 로드
  useEffect(() => {
    const loadReadingBooks = async () => {
      if (!isAuthenticated) return
      
      try {
        // 백엔드 API에서 책 목록 가져오기
        const allBooks = await bookAPI.getMyBooks()
        // 백엔드 API 응답 필드명을 프론트엔드 형식으로 변환 (snake_case -> camelCase)
        const transformedBooks = allBooks.map(book => ({
          ...book,
          totalPage: book.total_page ?? book.totalPage,
          readPage: book.read_page ?? book.readPage,
          totalReadingTime: book.total_reading_time ?? book.totalReadingTime,
          startDate: book.start_date ?? book.startDate,
          completedDate: book.completed_date ?? book.completedDate,
          publishDate: book.publish_date ?? book.publishDate,
        }))
        const reading = transformedBooks.filter(book => book.status === 'reading')
        setReadingBooks(reading)
        // localStorage도 업데이트 (다른 컴포넌트와의 호환성을 위해)
        localStorage.setItem('myLibraryBooks', JSON.stringify(transformedBooks))
      } catch (error) {
        console.error('Failed to load reading books from API:', error)
        // API 실패 시 빈 배열로 설정 (잘못된 ID 사용 방지)
        setReadingBooks([])
      }
    }

    if (isAuthenticated) {
      loadReadingBooks()
    }

    // storage 이벤트 리스너 추가 (다른 탭에서 변경 시 업데이트)
    const handleStorageChange = (e) => {
      if (e.key === 'myLibraryBooks' && isAuthenticated) {
        loadReadingBooks()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isAuthenticated])

  // 독서 세션 로드
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('readingSession')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        if (session.startTime) {
          session.startTime = new Date(session.startTime)
          const now = new Date()
          const hoursSinceStart = (now - session.startTime) / (1000 * 60 * 60)
          if (hoursSinceStart < 24) {
            setReadingSession(session)
          } else {
            localStorage.removeItem('readingSession')
          }
        }
      }
    } catch (error) {
      console.error('Failed to load reading session:', error)
    }
  }, [])

  // 독서 세션 저장
  useEffect(() => {
    if (readingSession) {
      try {
        localStorage.setItem('readingSession', JSON.stringify(readingSession))
      } catch (error) {
        console.error('Failed to save reading session:', error)
      }
    } else {
      localStorage.removeItem('readingSession')
    }
  }, [readingSession])

  // 실시간 타이머 업데이트
  useEffect(() => {
    if (readingSession) {
      const interval = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [readingSession])

  // 시간 형식 변환 함수
  const formatTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds === 0) return '0m'
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // 현재 세션 경과 시간 계산
  const getCurrentSessionTime = () => {
    if (!readingSession) return 0
    const elapsed = Math.floor((currentTime - readingSession.startTime) / 1000)
    return elapsed
  }

  // 독서 시작
  const handleStartReading = (bookId) => {
    setSelectedBookId(bookId)
    setShowStartModal(true)
  }

  const confirmStartReading = () => {
    if (selectedBookId) {
      setReadingSession({
        bookId: selectedBookId,
        startTime: new Date()
      })
      setShowStartModal(false)
      setToastMessage('독서를 시작했습니다.')
      setTimeout(() => setToastMessage(''), 3000)
    }
  }

  // 독서 종료
  const handleStopReading = (bookId) => {
    setSelectedBookId(bookId)
    setShowEndModal(true)
  }

  const confirmStopReading = async (pagesRead) => {
    if (!selectedBookId || !readingSession) return

    const book = readingBooks.find(b => b.id === selectedBookId)
    if (!book) {
      console.error('Book not found for selectedBookId:', selectedBookId)
      return
    }

    // book.id가 유효한 숫자인지 확인 (타임스탬프 등 잘못된 값 방지)
    const bookId = Number(book.id)
    if (isNaN(bookId) || bookId <= 0 || bookId > 2147483647) {
      console.error('Invalid book.id:', book.id, 'type:', typeof book.id, 'book:', book)
      setToastMessage('유효하지 않은 책 ID입니다. 페이지를 새로고침해주세요.')
      setShowEndModal(false)
      return
    }

    // 세션 시간 계산
    const sessionDuration = Math.floor((new Date() - readingSession.startTime) / 1000)

    // 날짜별 독서 기록 저장 (백엔드)
    await saveReadingSession(
      bookId,
      book.title,
      book.author,
      book.thumbnail || '',
      pagesRead,
      sessionDuration,
      readingSession.startTime
    )

    // 백엔드에서 책 목록 다시 로드 (진행률은 백엔드에서 자동 업데이트됨)
    try {
      const allBooks = await bookAPI.getMyBooks()
      // 필드명 변환
      const transformedBooks = allBooks.map(book => ({
        ...book,
        totalPage: book.total_page ?? book.totalPage,
        readPage: book.read_page ?? book.readPage,
        totalReadingTime: book.total_reading_time ?? book.totalReadingTime,
        startDate: book.start_date ?? book.startDate,
        completedDate: book.completed_date ?? book.completedDate,
        publishDate: book.publish_date ?? book.publishDate,
      }))
      const reading = transformedBooks.filter(b => b.status === 'reading')
      setReadingBooks(reading)
      
      // localStorage도 업데이트 (폴백용)
      localStorage.setItem('myLibraryBooks', JSON.stringify(transformedBooks))
    } catch (error) {
      console.error('Failed to update book:', error)
    }

    // 세션 종료
    setReadingSession(null)
    setShowEndModal(false)
    setSelectedBookId(null)
    setToastMessage('독서가 종료되었습니다.')
    setTimeout(() => setToastMessage(''), 3000)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-6xl font-semibold text-gray-900 mb-6 tracking-tight">
              BookLens
            </h1>
            <p className="text-xl text-gray-600 mb-12 font-light leading-relaxed">
              당신의 독서 여정을 기록하고 공유하세요
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/signup"
                className="bg-gray-900 text-white px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
              >
                시작하기
              </Link>
              <Link
                to="/mylibrary"
                className="bg-white text-gray-900 px-8 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 font-medium text-sm"
              >
                내 서재
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reading Calendar Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">독서 달력</h2>
          <p className="text-gray-500 text-[15px]">날짜를 클릭하면 해당 날짜의 독서 기록을 확인할 수 있습니다</p>
        </div>
        <ReadingCalendar
          onDateClick={(date, data) => {
            setSelectedDate(date)
            setSelectedDateData(data)
            setShowDateDetailModal(true)
          }}
        />
      </section>

      {/* Currently Reading Section */}
      {readingBooks.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">현재 읽고 있는 책</h2>
            <p className="text-gray-500 text-[15px]">독서를 계속하거나 새로 시작해보세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readingBooks.map((book) => {
              const isReading = readingSession && readingSession.bookId === book.id
              const currentSessionTime = isReading ? getCurrentSessionTime() : 0
              const totalTime = (book.totalReadingTime || 0) + currentSessionTime
              const progressPercentage = book.totalPage > 0
                ? Math.round(((book.readPage || 0) / book.totalPage) * 100)
                : book.progress

              return (
                <div
                  key={book.id}
                  className={`bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-200 ${
                    book.status === 'reading' && !isReading ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (book.status === 'reading' && !isReading) {
                      handleStartReading(book.id)
                    }
                  }}
                >
                  <div className="flex gap-4">
                    {/* Book Cover */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-36 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        {book.thumbnail ? (
                          <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            📚
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{book.author}</p>

                      {/* Progress Bar */}
                      {book.totalPage > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">
                              {progressPercentage}%
                            </span>
                            <span className="text-xs text-gray-400">
                              {book.readPage || 0} / {book.totalPage} 페이지
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Reading Time */}
                      {totalTime > 0 && (
                        <p className="text-xs text-gray-500 mb-3">
                          독서 시간: <span className="font-semibold text-gray-900">{formatTime(totalTime)}</span>
                          {isReading && (
                            <span className="ml-2 text-gray-400">
                              (진행 중: {formatTime(currentSessionTime)})
                            </span>
                          )}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        {isReading ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStopReading(book.id)
                            }}
                            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
                          >
                            읽기 종료
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartReading(book.id)
                            }}
                            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium text-sm"
                          >
                            읽기 시작
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-32">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">BookLens</h3>
              <p className="text-gray-500 text-sm">
                당신의 독서 여정을 함께합니다
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4 text-sm">서비스</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-gray-900 transition-colors">도서 목록</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">베스트셀러</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">신간 도서</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4 text-sm">회사</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-gray-900 transition-colors">소개</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">이용약관</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">개인정보처리방침</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4 text-sm">고객지원</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-gray-900 transition-colors">문의하기</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">자주 묻는 질문</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">공지사항</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 BookLens. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ReadingStartModal
        isOpen={showStartModal}
        onClose={() => {
          setShowStartModal(false)
          setSelectedBookId(null)
        }}
        onConfirm={confirmStartReading}
      />

      <ReadingEndModal
        isOpen={showEndModal}
        onClose={() => {
          setShowEndModal(false)
          setSelectedBookId(null)
        }}
        onConfirm={confirmStopReading}
        totalPages={readingBooks.find(b => b.id === selectedBookId)?.totalPage || 0}
        currentPage={readingBooks.find(b => b.id === selectedBookId)?.readPage || 0}
      />

      {/* Date Detail Modal */}
      <ReadingDateDetailModal
        isOpen={showDateDetailModal}
        date={selectedDate}
        readingData={selectedDateData}
        onClose={() => {
          setShowDateDetailModal(false)
          setSelectedDate(null)
          setSelectedDateData(null)
        }}
      />

      {/* Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  )
}

export default HomePage
