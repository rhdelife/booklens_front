import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDarkMode } from '../contexts/DarkModeContext'

const PostingPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { isDark } = useDarkMode()
  const book = location.state?.book
  const editingPosting = location.state?.editingPosting
  const isEditing = !!editingPosting

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 5,
    tags: ''
  })

  const [currentBook, setCurrentBook] = useState(book)

  useEffect(() => {
    // 책 정보가 없으면 localStorage에서 완독 책 찾기 (테스트용)
    if (!currentBook) {
      try {
        const savedBooks = localStorage.getItem('myLibraryBooks')
        if (savedBooks) {
          const allBooks = JSON.parse(savedBooks)
          const completedBook = allBooks.find(b => b.status === 'completed')
          if (completedBook) {
            setCurrentBook(completedBook)
            return
          }
        }
      } catch (error) {
        console.error('Failed to load books:', error)
      }
      // 완독 책도 없으면 마이라이브러리로 리다이렉트
      navigate('/mylibrary')
      return
    }

    // 수정 모드일 때 기존 포스팅 데이터 로드
    if (isEditing && editingPosting) {
      setFormData({
        title: editingPosting.title || '',
        content: editingPosting.content || '',
        rating: editingPosting.rating || 5,
        tags: editingPosting.tags ? editingPosting.tags.join(', ') : ''
      })
    }
  }, [currentBook, navigate, isEditing, editingPosting])

  if (!currentBook) {
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    try {
      const existingPostings = JSON.parse(localStorage.getItem('bookPostings') || '[]')

      if (isEditing && editingPosting) {
        // 수정 모드: 기존 포스팅 업데이트
        const updatedPostings = existingPostings.map(p => {
          if (p.id === editingPosting.id) {
            return {
              ...p,
              title: formData.title || `${book.title} 독후감`,
              content: formData.content,
              rating: formData.rating,
              tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
              updatedAt: new Date().toISOString()
            }
          }
          return p
        })
        localStorage.setItem('bookPostings', JSON.stringify(updatedPostings))

        // storage 이벤트 발생시켜서 다른 컴포넌트에서 업데이트되도록 함
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'bookPostings',
          newValue: JSON.stringify(updatedPostings),
          storageArea: localStorage
        }))
        // 같은 탭에서도 업데이트되도록 커스텀 이벤트 발생
        window.dispatchEvent(new Event('bookPostingsUpdated'))

        // 완료 후 커뮤니티 페이지로 이동
        navigate('/community', {
          state: {
            message: '포스팅이 수정되었습니다!',
            postingId: editingPosting.id,
            filterMyPosts: true
          }
        })
      } else {
        // user가 없을 때를 위한 임시 사용자 ID 생성/가져오기
        let currentUserId = user?.id
        if (!currentUserId) {
          let tempUserId = localStorage.getItem('tempUserId')
          if (!tempUserId) {
            tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            localStorage.setItem('tempUserId', tempUserId)
          }
          currentUserId = tempUserId
        }

        // 새 포스팅 작성
        const posting = {
          id: Date.now(),
          authorId: currentUserId,
          userId: currentUserId,
          authorName: user?.name || user?.email?.split('@')[0] || '익명',
          userName: user?.name || user?.email?.split('@')[0] || '익명',
          userEmail: user?.email || '',
          bookId: currentBook.id,
          bookTitle: currentBook.title,
          bookAuthor: currentBook.author,
          bookThumbnail: currentBook.thumbnail || '',
          title: formData.title || `${currentBook.title} 독후감`,
          content: formData.content,
          rating: formData.rating,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          createdAt: new Date().toISOString(),
          completedDate: currentBook.completedDate
        }

        existingPostings.push(posting)
        localStorage.setItem('bookPostings', JSON.stringify(existingPostings))

        // storage 이벤트 발생시켜서 다른 컴포넌트에서 업데이트되도록 함
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'bookPostings',
          newValue: JSON.stringify(existingPostings),
          storageArea: localStorage
        }))
        // 같은 탭에서도 업데이트되도록 커스텀 이벤트 발생
        window.dispatchEvent(new Event('bookPostingsUpdated'))

        // 완료 후 커뮤니티 페이지로 이동
        navigate('/community', {
          state: {
            message: '포스팅이 작성되었습니다!',
            postingId: posting.id
          }
        })
      }
    } catch (error) {
      console.error('Failed to save posting:', error)
      alert('포스팅 저장에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/mylibrary')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로가기
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {isEditing ? 'Edit Posting' : 'Write a Posting'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditing ? 'Edit your posting' : 'Share your thoughts about a completed book'}
          </p>
        </div>

        {/* Book Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{currentBook.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{currentBook.author}</p>
              {currentBook.completedDate && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>완독일:</span>
                  <span className="font-semibold">{currentBook.completedDate}</span>
                </div>
              )}
            </div>
            <div className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold">
              완독
            </div>
          </div>
        </div>

        {/* Posting Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                포스팅 제목 <span className="text-gray-400 dark:text-gray-500">(선택)</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={`${currentBook.title} POSTING`}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">If you don't enter a title, the default title will be used.</p>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`text-3xl transition-transform hover:scale-110 ${star <= formData.rating ? 'text-yellow-500' : 'text-gray-200'
                      }`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-gray-600 dark:text-gray-400 font-medium">{formData.rating}점</span>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                내용 <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="이 책을 읽고 느낀 점, 인상 깊었던 부분, 추천하는 이유 등을 자유롭게 작성해주세요..."
                rows={12}
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 resize-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formData.content.length}자
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Tags <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="예: 소설, 추리, 감동 (쉼표로 구분)"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">태그를 쉼표로 구분하여 입력하세요.</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/mylibrary')}
                className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.content.trim()}
                className="flex-1 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 font-medium disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
              >
                {isEditing ? 'Edit Posting' : 'Write a Posting'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostingPage

