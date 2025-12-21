import React, { useState } from 'react'

const ReadingEndModal = ({ isOpen, onClose, onConfirm, totalPages, currentPage }) => {
  const [pagesRead, setPagesRead] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    const pages = parseInt(pagesRead, 10)
    if (isNaN(pages) || pages < 0) {
      alert('유효한 페이지 숫자를 입력해주세요.')
      return
    }
    const currentReadPage = currentPage || 0
    const newTotalPages = currentReadPage + pages
    if (newTotalPages > totalPages) {
      alert(`입력한 페이지 수를 더하면 총 페이지 수(${totalPages}페이지)를 초과합니다.\n현재까지 읽은 페이지: ${currentReadPage}페이지\n이번 세션에서 읽은 페이지: ${pages}페이지\n합계: ${newTotalPages}페이지`)
      return
    }
    // 이번 세션에서 읽은 페이지 수를 전달 (누적은 confirmStopReading에서 처리)
    onConfirm(pages)
    setPagesRead('')
  }

  const handleClose = () => {
    setPagesRead('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-auto border border-gray-100 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center tracking-tight">
            이번 세션에서 읽은 페이지를 입력하세요
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              이번 세션에서 읽은 페이지 수
            </label>
            <input
              type="number"
              value={pagesRead}
              onChange={(e) => setPagesRead(e.target.value)}
              placeholder="예: 30"
              min="0"
              max={totalPages - (currentPage || 0)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-center text-lg"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              현재까지 읽은 페이지: {currentPage || 0} / {totalPages} 페이지
            </p>
            {pagesRead && !isNaN(parseInt(pagesRead, 10)) && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center font-medium">
                입력 후 총 읽은 페이지: {currentPage + parseInt(pagesRead, 10)} / {totalPages} 페이지
              </p>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleConfirm}
              className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 text-sm"
            >
              확인
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-all duration-200 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReadingEndModal










