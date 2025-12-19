import { useState } from 'react'
import { aiAPI } from '../services/api'

const INPUT_TYPES = {
  isbn: 'ISBN',
  title: '제목',
}

const emptyUserContext = {
  recentBooks: [],
  preferredGenres: '',
  readingGoal: '',
}

const createEmptyRecentBook = () => ({
  title: '',
  author: '',
  genre: '',
  rating: '',
})

const RecommendPage = () => {
  const [inputType, setInputType] = useState('isbn')
  const [query, setQuery] = useState('')
  const [userContext, setUserContext] = useState(emptyUserContext)
  const [recentBookDraft, setRecentBookDraft] = useState(createEmptyRecentBook())
  const [recommendations, setRecommendations] = useState(null)
  const [seed, setSeed] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAddRecentBook = () => {
    if (!recentBookDraft.title.trim()) return

    setUserContext((prev) => ({
      ...prev,
      recentBooks: [
        ...(prev.recentBooks || []),
        {
          title: recentBookDraft.title.trim(),
          author: recentBookDraft.author.trim() || undefined,
          genre: recentBookDraft.genre.trim() || undefined,
          rating: recentBookDraft.rating ? Number(recentBookDraft.rating) : undefined,
        },
      ],
    }))
    setRecentBookDraft(createEmptyRecentBook())
  }

  const handleRemoveRecentBook = (index) => {
    setUserContext((prev) => ({
      ...prev,
      recentBooks: prev.recentBooks.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setRecommendations(null)
    setSeed(null)

    if (!query.trim()) {
      setError('ISBN 또는 책 제목을 입력해주세요.')
      return
    }

    // userContext 정리
    const payloadUserContext = {
      recentBooks: (userContext.recentBooks || []).map((b) => ({
        title: b.title,
        author: b.author || undefined,
        genre: b.genre || undefined,
        rating: typeof b.rating === 'number' ? b.rating : undefined,
      })),
      preferredGenres: userContext.preferredGenres
        ? userContext.preferredGenres
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
        : [],
      readingGoal: userContext.readingGoal || undefined,
    }

    const payload = {
      inputType,
      query: query.trim(),
      userContext: payloadUserContext,
    }

    setIsLoading(true)
    try {
      const result = await aiAPI.getRecommendations(payload)
      setSeed(result.seed || null)
      setRecommendations(result.items || [])
    } catch (err) {
      console.error('AI 추천 요청 실패:', err)
      setError(err.message || '추천을 가져오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const hasResults = recommendations && recommendations.length > 0

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
            AI 도서 추천
          </h1>
          <p className="text-gray-500 text-[15px]">
            ISBN 또는 책 제목을 기반으로, 나의 독서 취향에 맞는 책을 추천받아 보세요.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 border border-gray-100 mb-8 space-y-6"
        >
          {/* Input type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              입력 유형
            </label>
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs font-medium">
              {Object.entries(INPUT_TYPES).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInputType(value)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    inputType === value
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Query input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {inputType === 'isbn' ? 'ISBN' : '책 제목'}
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                inputType === 'isbn'
                  ? '예: 9781234567890'
                  : '예: 해리포터와 마법사의 돌'
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">
              ISBN이 가장 정확하지만, 제목만으로도 추천을 받을 수 있습니다.
            </p>
          </div>

          {/* User context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent books */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-900">
                  최근에 읽은 책 (선택)
                </label>
                <span className="text-xs text-gray-400">
                  최대 5권까지 추가하면 좋아요
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={recentBookDraft.title}
                  onChange={(e) =>
                    setRecentBookDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="제목"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={recentBookDraft.author}
                    onChange={(e) =>
                      setRecentBookDraft((prev) => ({ ...prev, author: e.target.value }))
                    }
                    placeholder="저자 (선택)"
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                  <input
                    type="text"
                    value={recentBookDraft.genre}
                    onChange={(e) =>
                      setRecentBookDraft((prev) => ({ ...prev, genre: e.target.value }))
                    }
                    placeholder="장르 (선택)"
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={recentBookDraft.rating}
                    onChange={(e) =>
                      setRecentBookDraft((prev) => ({ ...prev, rating: e.target.value }))
                    }
                    placeholder="평점 (1-5)"
                    className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecentBook}
                    disabled={!recentBookDraft.title.trim()}
                    className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    책 추가
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(userContext.recentBooks || []).length === 0 ? (
                  <p className="text-xs text-gray-400">
                    최근에 인상 깊게 읽은 책이 있다면 추가해 주세요. 더 정교한 추천에 도움이 됩니다.
                  </p>
                ) : (
                  userContext.recentBooks.map((book, index) => (
                    <div
                      key={`${book.title}-${index}`}
                      className="flex items-start justify-between p-2 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="text-xs text-gray-700">
                        <div className="font-medium line-clamp-1">{book.title}</div>
                        {book.author && (
                          <div className="text-gray-500 line-clamp-1">{book.author}</div>
                        )}
                        {(book.genre || book.rating) && (
                          <div className="text-[11px] text-gray-400 mt-1">
                            {book.genre && <span>{book.genre}</span>}
                            {book.genre && book.rating && <span className="mx-1">·</span>}
                            {book.rating && <span>{book.rating}점</span>}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecentBook(index)}
                        className="ml-2 text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  선호 장르 (쉼표로 구분, 선택)
                </label>
                <input
                  type="text"
                  value={userContext.preferredGenres}
                  onChange={(e) =>
                    setUserContext((prev) => ({ ...prev, preferredGenres: e.target.value }))
                  }
                  placeholder="예: 판타지, 자기계발, 심리학"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  독서 목표 (선택)
                </label>
                <textarea
                  value={userContext.readingGoal}
                  onChange={(e) =>
                    setUserContext((prev) => ({ ...prev, readingGoal: e.target.value }))
                  }
                  rows={3}
                  placeholder="예: 올해는 마음이 편안해지는 에세이를 많이 읽고 싶어요."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '추천 생성 중...' : '추천받기'}
            </button>
          </div>
        </form>

        {/* Error / Info */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-900" />
              <span className="ml-2 text-sm text-gray-600">AI가 추천을 준비 중입니다...</span>
            </div>
          )}

          {!isLoading && !error && !hasResults && !seed && (
            <div className="py-8 text-center text-sm text-gray-400">
              아직 추천 결과가 없습니다. 상단에서 책 정보를 입력하고 &quot;추천받기&quot; 버튼을 눌러보세요.
            </div>
          )}

          {!isLoading && (seed || hasResults) && (
            <div className="space-y-4">
              {seed && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">
                    기준 도서
                  </h2>
                  <div className="text-sm text-gray-800">
                    <div className="font-medium">{seed.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {seed.author}
                      {seed.genre && <span className="ml-1 text-gray-400">· {seed.genre}</span>}
                    </div>
                    {seed.isbn13 && (
                      <div className="text-[11px] text-gray-400 mt-1">ISBN-13: {seed.isbn13}</div>
                    )}
                  </div>
                </div>
              )}

              {hasResults && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">
                    추천 도서 ({recommendations.length}권)
                  </h2>
                  <div className="space-y-3">
                    {recommendations.map((item, index) => (
                      <div
                        key={`${item.title}-${index}`}
                        className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/60 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {item.author}
                              {item.genre && (
                                <span className="ml-1 text-gray-400">· {item.genre}</span>
                              )}
                            </div>
                            {item.reason && (
                              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {item.reason}
                              </p>
                            )}
                          </div>
                          {item.keywords && item.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-end min-w-[80px]">
                              {item.keywords.slice(0, 3).map((kw, i) => (
                                <span
                                  key={`${kw}-${i}`}
                                  className="inline-flex px-2 py-0.5 rounded-full bg-gray-900 text-white text-[10px] font-medium"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecommendPage


