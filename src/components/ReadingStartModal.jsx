import React from 'react'

const ReadingStartModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center tracking-tight">
            책 읽기를 시작하시겠습니까?
          </h2>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onConfirm}
              className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 text-sm"
            >
              예
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 border border-gray-200 transition-all duration-200 text-sm"
            >
              아니오
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReadingStartModal










