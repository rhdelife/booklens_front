import { useState } from 'react'
import { useDarkMode } from '../contexts/DarkModeContext'
import { aiAPI } from '../services/api'

const RecommendPage = () => {
  const { isDark } = useDarkMode()
  const [bookTitle, setBookTitle] = useState('')
  const [preferredGenres, setPreferredGenres] = useState('')
  const [recommendations, setRecommendations] = useState(null)
  const [seed, setSeed] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setRecommendations(null)
    setSeed(null)

    if (!bookTitle.trim()) {
      setError('책 제목을 입력해주세요.')
      return
    }

    // userContext 정리
    const payloadUserContext = {
      preferredGenres: preferredGenres
        ? preferredGenres
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
        : [],
    }

    const payload = {
      inputType: 'title',
      query: bookTitle.trim(),
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
            AI 도서 추천
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-[15px]">
            책 제목과 좋아하는 장르를 입력하면, 나의 독서 취향에 맞는 책을 추천받을 수 있습니다.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-8 space-y-6"
        >
          {/* Book title input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              책 제목
            </label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="예: 해리포터와 마법사의 돌"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              추천을 받고 싶은 책의 제목을 입력해주세요.
            </p>
          </div>

          {/* Preferred genres */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              좋아하는 장르 (선택)
            </label>
            <input
              type="text"
              value={preferredGenres}
              onChange={(e) => setPreferredGenres(e.target.value)}
              placeholder="예: 판타지, 자기계발, 심리학"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              쉼표로 구분하여 여러 장르를 입력할 수 있습니다.
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!bookTitle.trim() || isLoading}
              className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '추천 생성 중...' : '추천받기'}
            </button>
          </div>
        </form>

        {/* Error / Info */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-gray-100" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">AI가 추천을 준비 중입니다...</span>
            </div>
          )}

          {!isLoading && !error && !hasResults && !seed && (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              아직 추천 결과가 없습니다. 상단에서 책 정보를 입력하고 &quot;추천받기&quot; 버튼을 눌러보세요.
            </div>
          )}

          {!isLoading && (seed || hasResults) && (
            <div className="space-y-4">
              {seed && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    기준 도서
                  </h2>
                  <div className="text-sm text-gray-800 dark:text-gray-200">
                    <div className="font-medium">{seed.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {seed.author}
                      {seed.genre && <span className="ml-1 text-gray-400 dark:text-gray-500">· {seed.genre}</span>}
                    </div>
                    {seed.isbn13 && (
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">ISBN-13: {seed.isbn13}</div>
                    )}
                  </div>
                </div>
              )}

              {hasResults && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    추천 도서 ({recommendations.length}권)
                  </h2>
                  <div className="space-y-3">
                    {recommendations.map((item, index) => (
                      <div
                        key={`${item.title}-${index}`}
                        className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-gray-50/60 dark:bg-gray-700/60 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {item.author}
                              {item.genre && (
                                <span className="ml-1 text-gray-400 dark:text-gray-500">· {item.genre}</span>
                              )}
                            </div>
                            {item.reason && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                {item.reason}
                              </p>
                            )}
                          </div>
                          {item.keywords && item.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-end min-w-[80px]">
                              {item.keywords.slice(0, 3).map((kw, i) => (
                                <span
                                  key={`${kw}-${i}`}
                                  className="inline-flex px-2 py-0.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-medium"
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


