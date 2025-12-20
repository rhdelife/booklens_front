import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDarkMode } from '../contexts/DarkModeContext'

const CommunityPage = () => {
  const { user } = useAuth()
  const { isDark } = useDarkMode()
  const location = useLocation()
  const navigate = useNavigate()
  const [postings, setPostings] = useState([])
  const [filteredPostings, setFilteredPostings] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('latest') // 'latest', 'rating', 'oldest'
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false)

  useEffect(() => {
    // location state에서 필터 옵션 확인
    if (location.state?.filterMyPosts) {
      setShowMyPostsOnly(true)
    }
  }, [location.state])

  useEffect(() => {
    // localStorage에서 모든 포스팅 로드
    const loadPostings = () => {
      const savedPostings = localStorage.getItem('bookPostings')
      if (savedPostings) {
        try {
          const parsedPostings = JSON.parse(savedPostings)
          setPostings(parsedPostings)
        } catch (error) {
          console.error('Failed to load postings:', error)
        }
      }
    }

    loadPostings()

    // 다른 탭에서 포스팅이 추가될 수 있으므로 storage 이벤트 리스너 추가
    const handleStorageChange = (e) => {
      if (e.key === 'bookPostings') {
        loadPostings()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 검색 및 정렬
  useEffect(() => {
    let filtered = [...postings]

    // 내 포스트만 보기 필터
    if (showMyPostsOnly && user) {
      filtered = filtered.filter(posting =>
        posting.authorId === user.id || posting.userId === user.id
      )
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(posting =>
        posting.title.toLowerCase().includes(query) ||
        posting.bookTitle.toLowerCase().includes(query) ||
        posting.bookAuthor.toLowerCase().includes(query) ||
        posting.content.toLowerCase().includes(query) ||
        posting.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'latest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

    setFilteredPostings(filtered)
  }, [postings, searchQuery, sortBy, showMyPostsOnly, user])

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // 내용 미리보기 (일정 길이로 자르기)
  const getPreview = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  // 포스팅 삭제
  const handleDeletePosting = (postingId, e) => {
    e.stopPropagation() // 카드 클릭 이벤트 방지

    if (!window.confirm('정말 이 포스팅을 삭제하시겠습니까?')) {
      return
    }

    try {
      const savedPostings = localStorage.getItem('bookPostings')
      if (savedPostings) {
        const allPostings = JSON.parse(savedPostings)
        const updatedPostings = allPostings.filter(p => p.id !== postingId)
        localStorage.setItem('bookPostings', JSON.stringify(updatedPostings))
        setPostings(updatedPostings)
      }
    } catch (error) {
      console.error('Failed to delete posting:', error)
      alert('포스팅 삭제에 실패했습니다.')
    }
  }

  // 포스팅 수정
  const handleEditPosting = (posting, e) => {
    e.stopPropagation() // 카드 클릭 이벤트 방지

    // 포스팅 데이터를 기반으로 책 정보 재구성
    const bookData = {
      id: posting.bookId,
      title: posting.bookTitle,
      author: posting.bookAuthor,
      thumbnail: posting.bookThumbnail || '',
      completedDate: posting.completedDate
    }

    // 수정 모드로 PostingPage로 이동
    navigate('/posting', {
      state: {
        book: bookData,
        editingPosting: posting
      }
    })
  }

  // 내 포스트인지 확인
  const isMyPosting = (posting) => {
    if (!user) return false
    return posting.authorId === user.id || posting.userId === user.id
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
            커뮤니티
            {showMyPostsOnly && (
              <span className="ml-3 text-base font-normal text-gray-500 dark:text-gray-400">(내 포스트만)</span>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-[15px]">독서 후기를 공유하고 다른 사람들의 생각을 읽어보세요</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                검색
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="책 제목, 저자, 내용, 태그로 검색..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                정렬
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="latest">최신순</option>
                <option value="rating">평점순</option>
                <option value="oldest">오래된순</option>
              </select>
            </div>

            {/* 내 포스트만 보기 토글 */}
            {user && (
              <div className="flex items-end">
                <button
                  onClick={() => setShowMyPostsOnly(!showMyPostsOnly)}
                  className={`w-full px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm ${showMyPostsOnly
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                >
                  {showMyPostsOnly ? '전체 보기' : '내 포스트만'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Postings Count */}
        <div className="mb-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            총 <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredPostings.length}</span>개의 포스팅
          </p>
        </div>

        {/* Postings Grid */}
        {filteredPostings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 dark:text-gray-400 text-base mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '아직 포스팅이 없습니다'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {searchQuery ? '다른 검색어를 시도해보세요' : '첫 번째 포스팅을 작성해보세요!'}
            </p>
            {!searchQuery && (
              <Link
                to="/mylibrary"
                className="inline-block mt-4 px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
              >
                마이라이브러리로 가기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPostings.map((posting) => {
              const isMyPost = isMyPosting(posting)

              return (
                <div
                  key={posting.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                          {posting.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {posting.bookTitle}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">by {posting.bookAuthor}</span>
                        </div>
                        {posting.userName && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">작성자:</span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {posting.userName}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* 수정/삭제 버튼 (내 포스트일 때만) */}
                      {isMyPost && (
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={(e) => handleEditPosting(posting, e)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
                            title="수정"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDeletePosting(posting.id, e)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
                            title="삭제"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-base ${star <= posting.rating ? 'text-yellow-400' : 'text-gray-200'
                              }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {posting.rating}.0
                      </span>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                      {getPreview(posting.content)}
                    </p>

                    {/* Tags */}
                    {posting.tags && posting.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {posting.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                        {posting.tags.length > 3 && (
                          <span className="px-2 py-1 text-gray-400 dark:text-gray-500 text-xs">
                            +{posting.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(posting.createdAt)}
                      </span>
                      {posting.completedDate && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          완독: {posting.completedDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer with View Button */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                    <button className="w-full px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 font-medium text-sm">
                      자세히 보기
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityPage

