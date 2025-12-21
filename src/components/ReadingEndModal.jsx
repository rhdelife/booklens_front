import React, { useState } from 'react'

const ReadingEndModal = ({ isOpen, onClose, onConfirm, totalPages, currentPage }) => {
  const [finalPage, setFinalPage] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    const finalPageNum = parseInt(finalPage, 10)
    if (isNaN(finalPageNum) || finalPageNum < 0) {
      alert('유효한 페이지 숫자를 입력해주세요.')
      return
    }
    const currentReadPage = currentPage || 0

    // 입력한 최종 페이지가 현재 읽은 페이지보다 작으면 안됨
    if (finalPageNum < currentReadPage) {
      alert(`입력한 페이지는 현재까지 읽은 페이지(${currentReadPage}페이지)보다 작을 수 없습니다.`)
      return
    }

    // 입력한 최종 페이지가 총 페이지 수를 초과하면 안됨
    if (finalPageNum > totalPages) {
      alert(`입력한 페이지는 총 페이지 수(${totalPages}페이지)를 초과할 수 없습니다.`)
      return
    }

    // 최종 읽은 페이지를 전달 (confirmStopReading에서 차이값 계산)
    onConfirm(finalPageNum)
    setFinalPage('')
  }

  const handleClose = () => {
    setFinalPage('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-auto border border-gray-100 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center tracking-tight">
            어디까지 읽으셨나요?
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              현재까지 읽은 페이지
            </label>
            <input
              type="number"
              value={finalPage}
              onChange={(e) => setFinalPage(e.target.value)}
              placeholder={`예: ${totalPages}`}
              min={currentPage || 0}
              max={totalPages}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-center text-lg"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              현재까지 읽은 페이지: {currentPage || 0} / {totalPages} 페이지
            </p>
            {finalPage && !isNaN(parseInt(finalPage, 10)) && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center font-medium">
                입력하시면 총 읽은 페이지: {parseInt(finalPage, 10)} / {totalPages} 페이지
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










