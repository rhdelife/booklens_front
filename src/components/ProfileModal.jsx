import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import ReadingPersonaBadge from './ReadingPersonaBadge'
import { getOrCalculatePersona } from '../utils/readingPersona'
import ImageCropModal from './ImageCropModal'
import DefaultProfileIcon from './DefaultProfileIcon'

const ALIAS_OPTIONS = [
  '독서 초보',
  '독서가',
  '책 애호가',
  '열정적인 독서러',
  '책 덕후',
  '페이지 마스터',
  '시간의 지배자',
  '책벌레 오타쿠',
  '독서 마니아',
  '킹왕짱',
]

const ProfileModal = ({ isOpen, onClose, user }) => {
  const { user: currentUser, setUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [books, setBooks] = useState([])
  const [persona, setPersona] = useState(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  
  // 편집 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    alias: '',
    bio: '',
    profileImage: null,
    profileImagePreview: null,
  })

  // localStorage에서 책 데이터 가져오기
  useEffect(() => {
    if (isOpen) {
      const savedBooks = localStorage.getItem('myLibraryBooks')
      if (savedBooks) {
        try {
          const parsedBooks = JSON.parse(savedBooks)
          setBooks(parsedBooks)
          
          // 페르소나 계산
          const userId = currentUser?.id || localStorage.getItem('tempUserId') || 'anonymous'
          const calculatedPersona = getOrCalculatePersona(parsedBooks, userId)
          setPersona(calculatedPersona)
        } catch (error) {
          console.error('Failed to parse books from localStorage:', error)
        }
      }
    }
  }, [isOpen, currentUser])

  // 사용자 정보 로드
  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({
        name: currentUser.name || '',
        nickname: currentUser.nickname || currentUser.name || '',
        alias: currentUser.alias || '',
        bio: currentUser.bio || '책을 사랑하는 사람입니다. 매일 새로운 이야기를 만나고 있어요.',
        profileImage: null,
        profileImagePreview: null,
      })
    }
  }, [isOpen, currentUser])

  // 프로필 이미지 선택
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        // 크롭 모달 열기
        setSelectedImage(reader.result)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  // 크롭 완료
  const handleCropComplete = (croppedImage) => {
    setFormData({
      ...formData,
      profileImage: croppedImage,
      profileImagePreview: croppedImage,
    })
    setShowCropModal(false)
    setSelectedImage(null)
  }

  // 프로필 저장
  const handleSave = async () => {
    setLoading(true)
    try {
      // 프로필 이미지 업로드
      if (formData.profileImage) {
        await authAPI.uploadProfileImage(formData.profileImage)
      }

      // 프로필 정보 업데이트
      const updatedUser = await authAPI.updateProfile({
        name: formData.name,
        nickname: formData.nickname,
        alias: formData.alias,
        bio: formData.bio,
      })

      // 사용자 정보 업데이트
      sessionStorage.setItem('user', JSON.stringify(updatedUser.user))
      setUser(updatedUser.user)

      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('프로필 업데이트에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setLoading(false)
    }
  }

  // 편집 취소
  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        nickname: currentUser.nickname || currentUser.name || '',
        alias: currentUser.alias || '',
        bio: currentUser.bio || '책을 사랑하는 사람입니다. 매일 새로운 이야기를 만나고 있어요.',
        profileImage: null,
        profileImagePreview: null,
      })
    }
    setIsEditing(false)
  }

  if (!isOpen) return null

  const displayName = currentUser?.nickname || currentUser?.name || '사용자'
  const displayAlias = currentUser?.alias || '독서 초보'
  const displayBio = currentUser?.bio || '책을 사랑하는 사람입니다. 매일 새로운 이야기를 만나고 있어요.'
  const hasCustomImage = isEditing ? formData.profileImagePreview : false

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        // 크롭 모달이 열려있으면 배경 클릭 무시
        if (!showCropModal) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-auto border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">프로필</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm font-medium"
              >
                편집
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {hasCustomImage ? (
                <img
                  src={formData.profileImagePreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <DefaultProfileIcon
                  size={128}
                  name={displayName}
                  className="border-4 border-gray-200"
                />
              )}
              {isEditing && (
                <label className="absolute bottom-0 right-0 flex items-center justify-center bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-2 rounded-full cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {/* Persona Badge */}
            {persona && !isEditing && (
              <ReadingPersonaBadge persona={persona} size="md" />
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                이름
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900 text-sm"
                  placeholder="이름을 입력하세요"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-900 font-medium">{displayName}</p>
                </div>
              )}
            </div>

            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                닉네임
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900 text-sm"
                  placeholder="닉네임을 입력하세요"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-900 font-medium">{displayName}</p>
                </div>
              )}
            </div>

            {/* 별명 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                별명
              </label>
              {isEditing ? (
                <select
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900 text-sm"
                >
                  {ALIAS_OPTIONS.map((alias) => (
                    <option key={alias} value={alias}>
                      {alias}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-gray-100 rounded-xl border border-gray-200">
                  <p className="text-gray-900 font-semibold text-lg text-center">{displayAlias}</p>
                </div>
              )}
            </div>

            {/* 한줄소개 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                한줄소개
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900 text-sm min-h-[80px] resize-none"
                  placeholder="자신을 소개해주세요"
                  maxLength={200}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 min-h-[80px]">
                  <p className="text-gray-700 text-sm">{displayBio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '저장 중...' : '저장하기'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 text-sm disabled:opacity-50"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 text-sm"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 이미지 크롭 모달 */}
      <ImageCropModal
        isOpen={showCropModal}
        imageSrc={selectedImage}
        onCrop={handleCropComplete}
        onClose={() => {
          setShowCropModal(false)
          setSelectedImage(null)
        }}
      />
    </div>
  )
}

export default ProfileModal
