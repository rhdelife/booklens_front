import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDarkMode } from '../contexts/DarkModeContext'
import { bookAPI } from '../services/api'
import ReadingStartModal from '../components/ReadingStartModal'
import ReadingEndModal from '../components/ReadingEndModal'
import PostingConfirmModal from '../components/PostingConfirmModal'
import Toast from '../components/Toast'
import ReadingPersonaBadge from '../components/ReadingPersonaBadge'
import { searchBookByISBN, searchBooks } from '../lib/googleBooksApi'
import { validateRequired, validateLength, validateNumberRange, validateISBN } from '../utils/validation'
import { getOrCalculatePersona, recalculatePersona } from '../utils/readingPersona'
import { saveReadingSession } from '../utils/readingHistory'

const MyLibraryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDark } = useDarkMode()
  const [showAddForm, setShowAddForm] = useState(false)
  const [myPostingsCount, setMyPostingsCount] = useState(0)

  const [books, setBooks] = useState([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(false)
  const [persona, setPersona] = useState(null)

  // 독서 세션 관리
  const [readingSession, setReadingSession] = useState(null) // { bookId, startTime }
  const [currentTime, setCurrentTime] = useState(new Date()) // 실시간 업데이트용

  // 모달 상태
  const [showStartModal, setShowStartModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showPostingModal, setShowPostingModal] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState(null)
  const [selectedBookForPosting, setSelectedBookForPosting] = useState(null)

  // 토스트 메시지
  const [toastMessage, setToastMessage] = useState('')

  const [formErrors, setFormErrors] = useState({})
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    memo: '',
    totalPage: '',
    isbn: '',
    publisher: '',
    publishDate: '',
    thumbnail: ''
  })
  const [isLoadingBook, setIsLoadingBook] = useState(false)
  const [bookSearchError, setBookSearchError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState('isbn') // 'isbn' or 'title'

  // localStorage에서 독서 세션 데이터 로드
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('readingSession')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        // 세션 시작 시간을 Date 객체로 복원
        if (session.startTime) {
          session.startTime = new Date(session.startTime)
          // 세션이 24시간 이상 지났으면 무효화
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
      console.error('Failed to load reading session from localStorage:', error)
    }
  }, [])

  // 백엔드 API에서 책 목록 로드
  useEffect(() => {
    const loadBooks = async () => {
      if (!user) return // 인증되지 않은 경우 건너뛰기

      setIsLoadingBooks(true)
      try {
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
        setBooks(transformedBooks)
        // 캐시용으로 localStorage에 저장 (다른 컴포넌트 호환성)
        localStorage.setItem('myLibraryBooks', JSON.stringify(transformedBooks))
      } catch (error) {
        console.error('Failed to load books from API:', error)
        // API 실패 시 빈 배열로 설정
        setBooks([])
      } finally {
        setIsLoadingBooks(false)
      }
    }

    loadBooks()
  }, [user])

  // 페르소나 계산 및 업데이트
  useEffect(() => {
    const userId = user?.id || localStorage.getItem('tempUserId') || 'anonymous'
    const calculatedPersona = getOrCalculatePersona(books, userId)
    setPersona(calculatedPersona)
  }, [books, user])

  // 독서 세션이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (readingSession) {
      try {
        localStorage.setItem('readingSession', JSON.stringify(readingSession))
      } catch (error) {
        console.error('Failed to save reading session to localStorage:', error)
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
      }, 1000) // 1초마다 업데이트
      return () => clearInterval(interval)
    }
  }, [readingSession])

  // 시간 형식 변환 함수 (초 → "1h 30m")
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

  // 내 포스팅 개수 계산
  useEffect(() => {
    const loadMyPostings = () => {
      try {
        const savedPostings = localStorage.getItem('bookPostings')
        if (savedPostings) {
          const allPostings = JSON.parse(savedPostings)

          // user가 있으면 user.id로 필터링, 없으면 tempUserId로 필터링
          let userId = user?.id
          if (!userId) {
            userId = localStorage.getItem('tempUserId')
          }

          if (userId) {
            const myPostings = allPostings.filter(
              posting => posting.authorId === userId || posting.userId === userId
            )
            setMyPostingsCount(myPostings.length)
          } else {
            setMyPostingsCount(0)
          }
        } else {
          setMyPostingsCount(0)
        }
      } catch (error) {
        console.error('Failed to load my postings:', error)
        setMyPostingsCount(0)
      }
    }

    loadMyPostings()

    // storage 이벤트 리스너 추가 (다른 탭에서 포스팅 추가 시 업데이트)
    const handleStorageChange = (e) => {
      if (e.key === 'bookPostings') {
        loadMyPostings()
      }
    }

    // 같은 탭에서의 변경도 감지하기 위해 커스텀 이벤트도 리스닝
    const handleCustomStorageChange = () => {
      loadMyPostings()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('bookPostingsUpdated', handleCustomStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('bookPostingsUpdated', handleCustomStorageChange)
    }
  }, [user])

  // Calculate statistics
  const totalBooks = books.length
  const readingBooks = books.filter(book => book.status === 'reading')
  // 완독한 책: status가 'completed'이거나 readPage >= totalPage인 경우
  const completedBooks = books.filter(book => {
    const isCompletedByStatus = book.status === 'completed'
    const isCompletedByPages = book.totalPage > 0 && (book.readPage || 0) >= book.totalPage
    return isCompletedByStatus || isCompletedByPages
  })

  // 총 독서 시간 계산
  const totalReadingTime = books.reduce((sum, book) => sum + (book.totalReadingTime || 0), 0)

  // 오늘 읽은 시간 계산 (오늘 시작한 세션만)
  const todayReadingTime = readingSession
    ? getCurrentSessionTime()
    : 0

  const handleAddBook = async (e) => {
    e.preventDefault()
    setFormErrors({})

    // Validation
    const titleValidation = validateRequired(formData.title, '책 제목')
    const authorValidation = validateRequired(formData.author, '저자')
    const totalPageValidation = formData.totalPage
      ? validateNumberRange(parseInt(formData.totalPage, 10), 1, 10000, '총 페이지 수')
      : { isValid: true, error: null }

    if (!titleValidation.isValid || !authorValidation.isValid || !totalPageValidation.isValid) {
      setFormErrors({
        title: titleValidation.error,
        author: authorValidation.error,
        totalPage: totalPageValidation.error,
      })
      return
    }

    const totalPage = parseInt(formData.totalPage, 10) || 0

    // 백엔드 API로 책 추가
    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        memo: formData.memo || '',
        status: 'reading',
        start_date: new Date().toISOString().split('T')[0],
        total_page: totalPage,
        read_page: 0,
        publisher: formData.publisher || '',
        publish_date: formData.publishDate || '',
        thumbnail: formData.thumbnail || '',
        isbn: formData.isbn || ''
      }

      await bookAPI.addBook(bookData)
      // 백엔드에서 받은 책 목록 다시 로드
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
      setBooks(transformedBooks)
      localStorage.setItem('myLibraryBooks', JSON.stringify(transformedBooks))

      setFormData({
        title: '',
        author: '',
        memo: '',
        totalPage: '',
        isbn: '',
        publisher: '',
        publishDate: '',
        thumbnail: ''
      })
      setBookSearchError('')
      setSearchQuery('')
      setSearchResults([])
      setFormErrors({})
      setShowAddForm(false)
      setToastMessage('책이 추가되었습니다! 독서를 시작해보세요.')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error) {
      console.error('Failed to add book:', error)
      setToastMessage('책 추가에 실패했습니다.')
      setTimeout(() => setToastMessage(''), 3000)
    }
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

  const confirmStopReading = async (pagesReadInSession) => {
    if (!selectedBookId || !readingSession) return

    const book = books.find(b => b.id === selectedBookId)
    if (!book) {
      console.error('Book not found for selectedBookId:', selectedBookId)
      return
    }

    // book.id가 유효한 숫자인지 확인
    const bookId = Number(book.id)
    if (isNaN(bookId) || bookId <= 0 || bookId > 2147483647) {
      console.error('Invalid book.id:', book.id, 'type:', typeof book.id)
      setToastMessage('유효하지 않은 책 ID입니다. 페이지를 새로고침해주세요.')
      setShowEndModal(false)
      return
    }

    // 이번 세션에서 읽은 페이지 수를 기존 읽은 페이지에 누적
    const currentReadPage = book.readPage || 0
    const totalPagesRead = currentReadPage + pagesReadInSession

    // 총 페이지 수를 초과하지 않도록 제한
    const finalPagesRead = Math.min(totalPagesRead, book.totalPage || 0)

    // 세션 시간 계산
    const sessionDuration = Math.floor((new Date() - readingSession.startTime) / 1000)

    // 날짜별 독서 기록 저장 (백엔드) - 이번 세션에서 읽은 페이지 수를 전달
    let completedBook = null
    try {
      const saveResult = await saveReadingSession(
        bookId,
        book.title,
        book.author,
        book.thumbnail || '',
        pagesReadInSession, // 이번 세션에서 읽은 페이지 수
        sessionDuration,
        readingSession.startTime
      )

      // 백엔드에서 최신 책 목록 다시 로드
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
      setBooks(transformedBooks)

      // 완독 체크: readPage가 totalPage 이상인지 확인 (백엔드 status와 무관하게 판단)
      const updatedBook = transformedBooks.find(b => b.id === bookId)
      const isCompleted = updatedBook && updatedBook.totalPage > 0 && (updatedBook.readPage || 0) >= updatedBook.totalPage

      localStorage.setItem('myLibraryBooks', JSON.stringify(transformedBooks))

      // 완독된 경우 완독한 책 섹션에 표시되도록 하고, 포스팅 작성 모달 열기
      if (isCompleted && updatedBook) {
        // 세션 종료
        setReadingSession(null)
        setShowEndModal(false)
        setSelectedBookId(null)
        // 완독한 책을 포스팅 작성 모달로 열기
        setSelectedBookForPosting(updatedBook)
        setShowPostingModal(true)
        setToastMessage(`🎉 "${updatedBook.title}" 완독하셨습니다! 포스팅을 작성해보세요.`)
        setTimeout(() => setToastMessage(''), 3000)
        // 페이지 상단으로 스크롤 (완독한 책 섹션 보이도록)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      } else {
        setToastMessage(saveResult?.message || '독서가 종료되었습니다.')
        setTimeout(() => setToastMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to save reading session:', error)
      setToastMessage('독서 기록 저장에 실패했습니다.')
    }

    // 세션 종료
    setReadingSession(null)
    setShowEndModal(false)
    setSelectedBookId(null)
  }

  const handleProgressChange = (bookId, change) => {
    setBooks(books.map(book => {
      if (book.id === bookId) {
        const newProgress = Math.max(0, Math.min(100, book.progress + change))
        const newStatus = newProgress === 100 ? 'completed' : (newProgress > 0 ? 'reading' : 'not_started')
        return {
          ...book,
          progress: newProgress,
          status: newStatus,
          completedDate: newProgress === 100 && book.status !== 'completed'
            ? new Date().toISOString().split('T')[0]
            : book.completedDate
        }
      }
      return book
    }))
  }

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('정말 이 책을 삭제하시겠습니까?\n\n참고: 이 책과 관련된 독서 기록도 함께 삭제됩니다.')) {
      try {
        await bookAPI.deleteBook(bookId)
        // 백엔드에서 최신 책 목록 다시 로드
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
        setBooks(transformedBooks)
        localStorage.setItem('myLibraryBooks', JSON.stringify(transformedBooks))
        setToastMessage('책이 삭제되었습니다.')
        setTimeout(() => setToastMessage(''), 3000)
      } catch (error) {
        console.error('Failed to delete book:', error)
        // 에러 메시지 개선
        const errorMessage = error.message || '알 수 없는 오류'
        if (errorMessage.includes('Foreign key') || errorMessage.includes('constraint')) {
          setToastMessage('책 삭제에 실패했습니다. 이 책과 관련된 독서 기록이 있어 삭제할 수 없습니다. 백엔드에서 관련 기록을 먼저 삭제해야 합니다.')
        } else {
          setToastMessage(`책 삭제에 실패했습니다: ${errorMessage}`)
        }
        setTimeout(() => setToastMessage(''), 5000)
      }
    }
  }

  // ISBN으로 책 검색
  const handleSearchByISBN = async () => {
    setBookSearchError('')

    // ISBN validation
    const isbnValidation = validateISBN(formData.isbn)
    if (!isbnValidation.isValid) {
      setBookSearchError(isbnValidation.error)
      return
    }

    setIsLoadingBook(true)
    setBookSearchError('')

    try {
      const bookInfo = await searchBookByISBN(formData.isbn)

      // 폼 데이터 자동 채우기
      setFormData({
        ...formData,
        title: bookInfo.title || formData.title,
        author: bookInfo.author || formData.author,
        totalPage: bookInfo.pageCount ? String(bookInfo.pageCount) : formData.totalPage,
        publisher: bookInfo.publisher || formData.publisher,
        publishDate: bookInfo.publishedDate || formData.publishDate,
        thumbnail: bookInfo.thumbnail || formData.thumbnail,
        isbn: bookInfo.isbn13 || bookInfo.isbn10 || formData.isbn,
      })

      setToastMessage('책 정보를 불러왔습니다!')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error) {
      setBookSearchError(error.message || '책 정보를 불러오는데 실패했습니다.')
      console.error('ISBN 검색 오류:', error)
    } finally {
      setIsLoadingBook(false)
    }
  }

  // 제목/저자로 책 검색
  useEffect(() => {
    const searchBooksByQuery = async () => {
      if (!searchQuery.trim() || searchMode !== 'title') {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await searchBooks(searchQuery)
        setSearchResults(results || [])
      } catch (error) {
        console.error('책 검색 오류:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    // 디바운싱: 500ms 후 검색 실행
    const timeoutId = setTimeout(() => {
      searchBooksByQuery()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchMode])

  // 검색 결과에서 책 선택
  const handleSelectBook = (book) => {
    setFormData({
      title: book.title || '',
      author: book.author || '',
      totalPage: book.pageCount ? String(book.pageCount) : '',
      publisher: book.publisher || '',
      publishDate: book.publishedDate || '',
      thumbnail: book.thumbnail || '',
      isbn: book.isbn || book.isbn13 || book.isbn10 || '',
      memo: '',
    })
    setSearchResults([])
    setSearchQuery('')
    setToastMessage('책 정보를 불러왔습니다!')
    setTimeout(() => setToastMessage(''), 3000)
  }

  // 포스팅 확인 모달 열기
  const handlePostingClick = (book) => {
    setSelectedBookForPosting(book)
    setShowPostingModal(true)
  }

  // 포스팅 페이지로 이동
  const handleConfirmPosting = () => {
    if (selectedBookForPosting) {
      navigate('/posting', { state: { book: selectedBookForPosting } })
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#29303A]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">마이라이브러리</h1>
              {persona && <ReadingPersonaBadge persona={persona} size="md" />}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[15px]">나만의 독서 기록을 관리하고 추적하세요</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
          >
            + 새책 추가
          </button>
        </div>

        {/* Add New Book Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 tracking-tight">새 책 추가</h2>

            {/* 검색 모드 선택 */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode('isbn')
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm flex items-center justify-center ${searchMode === 'isbn'
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                >
                  ISBN 검색
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode('title')
                    setFormData({ ...formData, isbn: '' })
                    setBookSearchError('')
                  }}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm flex items-center justify-center ${searchMode === 'title'
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                >
                  제목/저자 검색
                </button>
              </div>

              {/* ISBN 검색 */}
              {searchMode === 'isbn' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ISBN으로 검색 <span className="text-gray-400">(선택)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => {
                        setFormData({ ...formData, isbn: e.target.value })
                        setBookSearchError('')
                      }}
                      placeholder="예: 9780140449136 또는 978-0-14-044913-6"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-sm"
                      disabled={isLoadingBook}
                    />
                    <button
                      type="button"
                      onClick={handleSearchByISBN}
                      disabled={isLoadingBook || !formData.isbn.trim()}
                      className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap text-sm flex items-center justify-center"
                    >
                      {isLoadingBook ? '검색 중...' : '검색'}
                    </button>
                  </div>
                  {bookSearchError && (
                    <p className="text-sm text-red-600 mt-1">{bookSearchError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    ISBN을 입력하고 검색 버튼을 누르면 책 정보가 자동으로 채워집니다.
                  </p>
                </div>
              )}

              {/* 제목/저자 검색 */}
              {searchMode === 'title' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    제목 또는 저자로 검색
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="예: 해리포터, 조지 오웰, 1984 등"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-brand-500 dark:focus:border-brand-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />

                  {/* 검색 결과 */}
                  {isSearching && (
                    <div className="flex justify-center items-center py-4 mt-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 dark:border-brand-400"></div>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">검색 중...</span>
                    </div>
                  )}

                  {!isSearching && searchQuery.trim() && searchResults.length > 0 && (
                    <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                      {searchResults.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => handleSelectBook(book)}
                          className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {book.thumbnail && (
                              <img
                                src={book.thumbnail}
                                alt={book.title}
                                className="w-12 h-16 object-cover rounded flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                                {book.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                {book.author}
                              </div>
                              {book.publisher && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {book.publisher}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center py-4">
                      검색 결과가 없습니다.
                    </p>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleAddBook}>
              <div className="space-y-4">

                {/* 책 표지 미리보기 */}
                {formData.thumbnail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">책 표지</label>
                    <div className="w-32 h-48 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                      <img
                        src={formData.thumbnail}
                        alt="책 표지"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">책 제목 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      if (formErrors.title) {
                        setFormErrors({ ...formErrors, title: null })
                      }
                    }}
                    placeholder="예: 아침을 여는 심리학"
                    className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm ${formErrors.title ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'
                      }`}
                    required
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">저자 *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => {
                      setFormData({ ...formData, author: e.target.value })
                      if (formErrors.author) {
                        setFormErrors({ ...formErrors, author: null })
                      }
                    }}
                    placeholder="예: 김철수"
                    className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm ${formErrors.author ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'
                      }`}
                    required
                  />
                  {formErrors.author && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.author}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">출판사</label>
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      placeholder="예: 문학수첩"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-brand-500 dark:focus:border-brand-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">발행일</label>
                    <input
                      type="text"
                      value={formData.publishDate}
                      onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                      placeholder="예: 2025.08.06"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-brand-500 dark:focus:border-brand-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">총 페이지 수</label>
                  <input
                    type="number"
                    value={formData.totalPage}
                    onChange={(e) => {
                      setFormData({ ...formData, totalPage: e.target.value })
                      if (formErrors.totalPage) {
                        setFormErrors({ ...formErrors, totalPage: null })
                      }
                    }}
                    placeholder="예: 300"
                    min="1"
                    className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm ${formErrors.totalPage ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'
                      }`}
                  />
                  {formErrors.totalPage && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.totalPage}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">메모 (선택)</label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    placeholder="이 책에 대한 첫 인상이나 목표를 적어보세요"
                    rows={4}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-brand-500 dark:focus:border-brand-400 resize-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({
                      title: '',
                      author: '',
                      memo: '',
                      totalPage: '',
                      isbn: '',
                      publisher: '',
                      publishDate: '',
                      thumbnail: ''
                    })
                    setBookSearchError('')
                    setSearchQuery('')
                    setSearchResults([])
                    setSearchMode('isbn')
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  추가하기
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="text-3xl font-semibold text-gray-900 mb-1">{totalBooks}</div>
              <div className="text-gray-500 text-sm">전체 도서</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="text-3xl font-semibold text-gray-900 mb-1">{readingBooks.length}</div>
              <div className="text-gray-500 text-sm">읽는 중</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="text-3xl font-semibold text-gray-900 mb-1">{completedBooks.length}</div>
              <div className="text-gray-500 text-sm">완독</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div
              onClick={() => navigate('/community', { state: { filterMyPosts: true } })}
              className="bg-white rounded-2xl p-6 border border-gray-100 cursor-pointer hover:border-gray-200 transition-all duration-200"
            >
              <div className="text-4xl font-semibold text-gray-900">{myPostingsCount}</div>
              <div className="text-gray-500 text-sm mt-1">내 포스트</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="text-4xl font-semibold text-gray-900">{formatTime(totalReadingTime)}</div>
              <div className="text-gray-500 text-sm mt-1">총 독서 시간</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="text-4xl font-semibold text-gray-900">{formatTime(todayReadingTime)}</div>
              <div className="text-gray-500 text-sm mt-1">오늘 읽은 시간</div>
            </div>
          </div>
        </div>

        {/* Completed Books Section */}
        {completedBooks.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">완독한 책</h2>
                <p className="text-gray-500 dark:text-gray-400 text-[15px]">완독한 책에 대한 포스팅을 작성해보세요</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {completedBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handlePostingClick(book)}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{book.author}</p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium whitespace-nowrap">
                      완독
                    </span>
                  </div>
                  {book.completedDate && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                      완독일: {book.completedDate}
                    </div>
                  )}
                  {book.memo && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic line-clamp-2 mb-3">
                      "{book.memo}"
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      독서 시간: {formatTime(book.totalReadingTime || 0)}
                    </span>
                    <div className="flex items-center text-gray-900 dark:text-gray-100 text-sm font-medium">
                      포스팅 작성하기
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book List */}
        <div className="space-y-4 mb-8">
          {books.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-base">아직 추가된 책이 없습니다.</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">새 책을 추가해보세요!</p>
            </div>
          ) : (
            books.map((book) => {
              const isReading = readingSession && readingSession.bookId === book.id
              const currentSessionTime = isReading ? getCurrentSessionTime() : 0
              const totalTime = (book.totalReadingTime || 0) + currentSessionTime
              // 진행률 계산 (정확한 소수점 계산)
              const rawProgress = book.totalPage > 0
                ? ((book.readPage || 0) / book.totalPage) * 100
                : book.progress || 0
              // 소수점 1자리까지 표시, 100% 초과 방지
              const progressPercentage = Math.min(100, Math.round(rawProgress * 10) / 10)

              // 완독 체크: readPage가 totalPage 이상이면 완독으로 처리
              const isCompleted = book.totalPage > 0 && (book.readPage || 0) >= book.totalPage

              return (
                <div
                  key={book.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 ${book.status === 'reading' ? 'cursor-pointer hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200' : ''
                    }`}
                  onClick={() => {
                    if (book.status === 'reading' && !isReading) {
                      handleStartReading(book.id)
                    }
                  }}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Book Cover */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-48 md:w-40 md:h-60 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        {book.thumbnail ? (
                          <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                            📚
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 pr-4">{book.title}</h3>
                          <span className={`text-xs font-medium px-3 py-1 rounded-lg whitespace-nowrap ${book.status === 'completed'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                            {book.status === 'completed' ? '완독' : '읽는 중'}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <p><span className="font-medium text-gray-700 dark:text-gray-300">저자</span>: {book.author}</p>
                          {book.publisher && (
                            <p><span className="font-medium text-gray-700 dark:text-gray-300">출판사</span>: {book.publisher}</p>
                          )}
                          {book.publishDate && (
                            <p>
                              <span className="font-medium text-gray-700 dark:text-gray-300">발행일</span>: {book.publishDate}
                              {book.isbn && ` | ISBN ${book.isbn}`}
                            </p>
                          )}
                          {book.totalPage > 0 && (
                            <p>
                              {book.totalPage}p
                              {book.size && ` | ${book.size}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {book.status === 'reading' && (
                        <div className="mt-auto">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              진행률: {progressPercentage.toFixed(1)}%
                              {isCompleted && <span className="ml-2 text-green-600 dark:text-green-400 font-medium">완독!</span>}
                            </span>
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              {Math.min(book.readPage || 0, book.totalPage || 0)} / {book.totalPage || 0} 페이지
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${isCompleted
                                ? 'bg-green-600 dark:bg-green-500'
                                : 'bg-gray-900 dark:bg-gray-100'
                                }`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {/* 독서 시간 표시 */}
                      {totalTime > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            총 독서시간: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatTime(totalTime)}</span>
                            {isReading && (
                              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                                (진행 중: {formatTime(currentSessionTime)})
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* 읽기 종료 버튼 */}
                      {isReading && !isCompleted && (
                        <div className="mb-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStopReading(book.id)
                            }}
                            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
                          >
                            읽기 종료
                          </button>
                        </div>
                      )}

                      {/* Memo */}
                      {book.memo && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 italic">"{book.memo}"</p>
                      )}

                      {/* Dates */}
                      <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                        <p>시작: {book.startDate}</p>
                        {book.completedDate && (
                          <p>완독: {book.completedDate}</p>
                        )}
                      </div>

                      {/* Delete Button */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBook(book.id)
                          }}
                          className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>

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
        totalPages={books.find(b => b.id === selectedBookId)?.totalPage || 0}
        currentPage={books.find(b => b.id === selectedBookId)?.readPage || 0}
      />

      <PostingConfirmModal
        isOpen={showPostingModal}
        onClose={() => {
          setShowPostingModal(false)
          setSelectedBookForPosting(null)
        }}
        onConfirm={handleConfirmPosting}
        book={selectedBookForPosting}
      />

      {/* Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  )
}

export default MyLibraryPage

