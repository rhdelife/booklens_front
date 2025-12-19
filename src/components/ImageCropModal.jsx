import { useState, useRef, useEffect } from 'react'

/**
 * 이미지 크롭 모달 컴포넌트
 * 원하는 영역을 선택하여 크롭할 수 있습니다.
 */
const ImageCropModal = ({ isOpen, imageSrc, onCrop, onClose }) => {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  const CROP_SIZE = 200 // 크롭 영역 크기 (정사각형)

  // 이미지 로드
  useEffect(() => {
    if (!isOpen || !imageSrc) return

    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height })
      setImageLoaded(true)
      
      // 초기 스케일 계산 (이미지가 크롭 영역보다 작으면 확대)
      const initialScale = Math.max(
        CROP_SIZE / img.width,
        CROP_SIZE / img.height,
        1
      )
      setScale(initialScale)
      
      // 중앙 정렬
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const containerHeight = containerRef.current.offsetHeight
        setPosition({
          x: (containerWidth - img.width * initialScale) / 2,
          y: (containerHeight - img.height * initialScale) / 2,
        })
      }
    }
    img.src = imageSrc
    imageRef.current = img
  }, [isOpen, imageSrc])

  // 마우스 드래그
  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    setIsDragging(true)
    setDragStart({
      x: mouseX - position.x,
      y: mouseY - position.y,
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return
    
    e.preventDefault()
    e.stopPropagation()

    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const newX = mouseX - dragStart.x
    const newY = mouseY - dragStart.y

    const containerWidth = containerRef.current.offsetWidth
    const containerHeight = containerRef.current.offsetHeight
    const imgWidth = imageRef.current.width * scale
    const imgHeight = imageRef.current.height * scale

    // 경계 체크 - 크롭 영역이 이미지 안에 있도록 제한
    const cropCenterX = containerWidth / 2
    const cropCenterY = containerHeight / 2
    const cropRadius = CROP_SIZE / 2
    
    // 이미지의 왼쪽 상단이 이동할 수 있는 범위
    const minX = cropCenterX - cropRadius - imgWidth
    const maxX = cropCenterX + cropRadius
    const minY = cropCenterY - cropRadius - imgHeight
    const maxY = cropCenterY + cropRadius

    setPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 줌 인/아웃
  const handleZoom = (delta) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta))
    setScale(newScale)
  }

  // 크롭 실행
  const handleCrop = () => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = imageRef.current

    const containerWidth = containerRef.current.offsetWidth
    const containerHeight = containerRef.current.offsetHeight
    
    // 크롭 영역의 중앙 좌표 (컨테이너 기준, 절대 좌표)
    const cropCenterX = containerWidth / 2
    const cropCenterY = containerHeight / 2
    
    // 이미지의 왼쪽 상단 좌표 (컨테이너 기준, 절대 좌표)
    const imgLeft = position.x
    const imgTop = position.y
    
    // 크롭 영역 중앙이 이미지 내에서 어느 위치인지 계산 (컨테이너 기준)
    const cropCenterInImageX = cropCenterX - imgLeft
    const cropCenterInImageY = cropCenterY - imgTop
    
    // 원본 이미지 좌표로 변환 (스케일 반영)
    const sourceX = cropCenterInImageX / scale
    const sourceY = cropCenterInImageY / scale
    
    // 크롭 영역 크기 (원본 이미지 기준)
    const cropSize = CROP_SIZE / scale
    
    // Canvas에 그리기
    canvas.width = CROP_SIZE
    canvas.height = CROP_SIZE
    
    // 이미지의 해당 영역을 크롭하여 Canvas에 그리기
    ctx.drawImage(
      img,
      sourceX - cropSize / 2,  // 원본 이미지에서 가져올 x 좌표
      sourceY - cropSize / 2,  // 원본 이미지에서 가져올 y 좌표
      cropSize,                // 원본 이미지에서 가져올 너비
      cropSize,                // 원본 이미지에서 가져올 높이
      0,                       // Canvas에 그릴 x 좌표
      0,                       // Canvas에 그릴 y 좌표
      CROP_SIZE,               // Canvas에 그릴 너비
      CROP_SIZE                // Canvas에 그릴 높이
    )

    // Base64로 변환
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
    onCrop(croppedImage)
    onClose()
  }

  if (!isOpen || !imageSrc) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        // 배경 클릭 시 모달 닫기 방지 (크롭 모달은 명시적으로 닫기 버튼만 사용)
        e.stopPropagation()
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">프로필 사진 편집</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* 크롭 영역 */}
          <div
            ref={containerRef}
            className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden mb-4"
            style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageLoaded && imageRef.current && (
              <img
                src={imageSrc}
                alt="Crop preview"
                className="absolute select-none"
                style={{
                  width: `${imageRef.current.width * scale}px`,
                  height: `${imageRef.current.height * scale}px`,
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  pointerEvents: 'none',
                }}
                draggable={false}
              />
            )}

            {/* 크롭 영역 가이드 */}
            <div
              className="absolute border-2 border-white shadow-lg"
              style={{
                width: `${CROP_SIZE}px`,
                height: `${CROP_SIZE}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            >
              {/* 중앙 십자선 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-white/30"></div>
                <div className="absolute w-px h-full bg-white/30"></div>
              </div>
            </div>
          </div>

          {/* 컨트롤 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleZoom(-0.1)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                🔍−
              </button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.1)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                🔍+
              </button>
            </div>
            <p className="text-xs text-gray-500">
              이미지를 드래그하여 위치를 조정하세요
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              취소
            </button>
            <button
              onClick={handleCrop}
              className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm"
            >
              적용하기
            </button>
          </div>
        </div>
      </div>

      {/* 숨겨진 Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default ImageCropModal

