const BookCard = ({ book, onClick }) => {
  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          완독
        </span>
      )
    }
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
        읽는중
      </span>
    )
  }

  const calculateDaysLeft = (returnDate) => {
    if (!returnDate) return null
    const today = new Date()
    const returnDateObj = new Date(returnDate)
    const diffTime = returnDateObj - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysLeft = book.returnDate ? calculateDaysLeft(book.returnDate) : null

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="flex gap-4">
        {/* 썸네일 */}
        <div className="flex-shrink-0">
          <img
            src={book.thumbnail || `https://via.placeholder.com/120x160/22c55e/ffffff?text=${encodeURIComponent(book.title.charAt(0))}`}
            alt={book.title}
            className="w-24 h-32 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform"
          />
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                {book.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{book.author}</p>
            </div>
            {getStatusBadge(book.status)}
          </div>

          <div className="mb-3">
            <span className="px-2 py-1 bg-brand-100 text-brand-700 rounded text-xs font-medium">
              {book.genre}
            </span>
          </div>

          {/* 진행률 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">진행률</span>
              <span className="text-xs font-semibold text-brand-600">{book.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-brand-400 to-brand-600 h-2 rounded-full transition-all"
                style={{ width: `${book.progress}%` }}
              ></div>
            </div>
          </div>

          {/* 반납일 */}
          {daysLeft !== null && (
            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-700">
                {daysLeft > 0 ? (
                  <>남은 반납일: <span className="font-semibold">{daysLeft}일</span></>
                ) : (
                  <span className="font-semibold text-red-600">반납일이 지났습니다</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookCard




