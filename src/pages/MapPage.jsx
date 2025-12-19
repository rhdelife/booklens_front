import { useState, useEffect, useRef } from 'react'
import { getRandomBooks, searchBooks } from '../lib/googleBooksApi'
import { searchLibrariesByBook, geocodeAddress } from '../lib/data4libraryApi'

const MapPage = () => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [searchQuery, setSearchQuery] = useState('')
  const [locations, setLocations] = useState([])
  const [filteredLocations, setFilteredLocations] = useState([])
  const [filterType, setFilterType] = useState('all') // 'all', 'library', 'bookstore'
  const [showList, setShowList] = useState(true)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [isLoadingLibraries, setIsLoadingLibraries] = useState(false)
  const [libraryError, setLibraryError] = useState(null)

  // Google Books API에서 책 검색
  useEffect(() => {
    const searchBooksByQuery = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await searchBooks(searchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error('책 검색 오류:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    // 디바운싱: 500ms 후 검색 실행
    const timeoutId = setTimeout(() => {
      searchBooksByQuery()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Dummy location data (libraries and bookstores) - 확장된 데이터
  const dummyLocations = [
    // 도서관
    { id: 1, name: '강남도서관', type: 'library', lat: 37.4979, lng: 127.0276, address: '서울특별시 강남구 테헤란로 123' },
    { id: 3, name: '서울시립도서관', type: 'library', lat: 37.5665, lng: 126.9780, address: '서울특별시 중구 세종대로 110' },
    { id: 5, name: '반포도서관', type: 'library', lat: 37.5041, lng: 127.0015, address: '서울특별시 서초구 반포대로 58' },
    { id: 7, name: '국립중앙도서관', type: 'library', lat: 37.4981, lng: 127.0048, address: '서울특별시 서초구 반포대로 201' },
    { id: 8, name: '마포도서관', type: 'library', lat: 37.5563, lng: 126.9104, address: '서울특별시 마포구 월드컵북로 400' },
    { id: 9, name: '송파도서관', type: 'library', lat: 37.5145, lng: 127.1058, address: '서울특별시 송파구 올림픽로 240' },
    { id: 10, name: '은평도서관', type: 'library', lat: 37.6028, lng: 126.9291, address: '서울특별시 은평구 은평로 195' },
    { id: 11, name: '강동도서관', type: 'library', lat: 37.5301, lng: 127.1234, address: '서울특별시 강동구 천호대로 1017' },
    // 서점
    { id: 2, name: '교보문고 강남점', type: 'bookstore', lat: 37.5045, lng: 127.0489, address: '서울특별시 강남구 강남대로 396' },
    { id: 4, name: '영풍문고 종로점', type: 'bookstore', lat: 37.5704, lng: 126.9920, address: '서울특별시 종로구 종로 1' },
    { id: 6, name: '알라딘 중고서적', type: 'bookstore', lat: 37.5512, lng: 126.9882, address: '서울특별시 마포구 홍대로 83' },
    { id: 12, name: '교보문고 광화문점', type: 'bookstore', lat: 37.5702, lng: 126.9780, address: '서울특별시 종로구 종로 1' },
    { id: 13, name: '반디앤루니스 강남점', type: 'bookstore', lat: 37.5012, lng: 127.0265, address: '서울특별시 강남구 테헤란로 152' },
    { id: 14, name: '영풍문고 신촌점', type: 'bookstore', lat: 37.5563, lng: 126.9369, address: '서울특별시 서대문구 신촌로 83' },
    { id: 15, name: '교보문고 잠실점', type: 'bookstore', lat: 37.5133, lng: 127.1028, address: '서울특별시 송파구 올림픽로 300' },
    { id: 16, name: '예스24 스토어', type: 'bookstore', lat: 37.5665, lng: 126.9780, address: '서울특별시 중구 세종대로 110' },
    { id: 17, name: '알라딘 강남점', type: 'bookstore', lat: 37.4979, lng: 127.0276, address: '서울특별시 강남구 테헤란로 521' },
    { id: 18, name: '영풍문고 목동점', type: 'bookstore', lat: 37.5264, lng: 126.8752, address: '서울특별시 양천구 목동로 225' },
    // 성해, 혼모노 관련 장소
    { id: 19, name: '성해 서점', type: 'bookstore', lat: 37.5492, lng: 126.9205, address: '서울특별시 마포구 홍익로 10' },
    { id: 20, name: '혼모노 도서관', type: 'library', lat: 37.5651, lng: 126.9895, address: '서울특별시 중구 명동길 26' },
    { id: 21, name: '성해 도서관', type: 'library', lat: 37.5172, lng: 127.0473, address: '서울특별시 강남구 역삼로 123' },
    { id: 22, name: '혼모노 서점', type: 'bookstore', lat: 37.5663, lng: 126.9779, address: '서울특별시 중구 세종대로 110' },
  ]

  // Dummy inventory data (책별 재고 정보) - 확장된 데이터
  // Google Books API에서 가져온 책은 제목으로 매칭
  const dummyInventory = [
    // 강남도서관 (id: 1)
    { locationId: 1, bookTitle: '해리포터', quantity: 5, availableQuantity: 3, price: null },
    { locationId: 1, bookTitle: '1984', quantity: 3, availableQuantity: 2, price: null },
    { locationId: 1, bookTitle: '노인과 바다', quantity: 4, availableQuantity: 4, price: null },
    { locationId: 1, bookTitle: '위대한 개츠비', quantity: 6, availableQuantity: 5, price: null },
    // 교보문고 강남점 (id: 2)
    { locationId: 2, bookTitle: '해리포터', quantity: 10, availableQuantity: 10, price: 15000 },
    { locationId: 2, bookTitle: '1984', quantity: 8, availableQuantity: 8, price: 15000 },
    { locationId: 2, bookTitle: '노인과 바다', quantity: 12, availableQuantity: 12, price: 12000 },
    { locationId: 2, bookTitle: '위대한 개츠비', quantity: 15, availableQuantity: 15, price: 13000 },
    { locationId: 2, bookTitle: '오만과 편견', quantity: 9, availableQuantity: 9, price: 14000 },
    // 서울시립도서관 (id: 3)
    { locationId: 3, bookTitle: '1984', quantity: 7, availableQuantity: 5, price: null },
    { locationId: 3, bookTitle: '노인과 바다', quantity: 6, availableQuantity: 4, price: null },
    { locationId: 3, bookTitle: '위대한 개츠비', quantity: 8, availableQuantity: 6, price: null },
    { locationId: 3, bookTitle: '오만과 편견', quantity: 5, availableQuantity: 3, price: null },
    // 영풍문고 종로점 (id: 4)
    { locationId: 4, bookTitle: '해리포터', quantity: 15, availableQuantity: 15, price: 14500 },
    { locationId: 4, bookTitle: '노인과 바다', quantity: 10, availableQuantity: 10, price: 12000 },
    { locationId: 4, bookTitle: '위대한 개츠비', quantity: 12, availableQuantity: 12, price: 13000 },
    { locationId: 4, bookTitle: '오만과 편견', quantity: 11, availableQuantity: 11, price: 14000 },
    // 반포도서관 (id: 5)
    { locationId: 5, bookTitle: '해리포터', quantity: 4, availableQuantity: 2, price: null },
    { locationId: 5, bookTitle: '위대한 개츠비', quantity: 3, availableQuantity: 3, price: null },
    { locationId: 5, bookTitle: '오만과 편견', quantity: 5, availableQuantity: 4, price: null },
    // 알라딘 중고서적 (id: 6)
    { locationId: 6, bookTitle: '1984', quantity: 5, availableQuantity: 5, price: 8000 },
    { locationId: 6, bookTitle: '노인과 바다', quantity: 8, availableQuantity: 8, price: 7000 },
    { locationId: 6, bookTitle: '위대한 개츠비', quantity: 6, availableQuantity: 6, price: 7500 },
    { locationId: 6, bookTitle: '오만과 편견', quantity: 4, availableQuantity: 4, price: 8500 },
    // 국립중앙도서관 (id: 7)
    { locationId: 7, bookTitle: '해리포터', quantity: 12, availableQuantity: 10, price: null },
    { locationId: 7, bookTitle: '1984', quantity: 9, availableQuantity: 7, price: null },
    { locationId: 7, bookTitle: '노인과 바다', quantity: 11, availableQuantity: 9, price: null },
    { locationId: 7, bookTitle: '위대한 개츠비', quantity: 8, availableQuantity: 6, price: null },
    { locationId: 7, bookTitle: '오만과 편견', quantity: 10, availableQuantity: 8, price: null },
    // 마포도서관 (id: 8)
    { locationId: 8, bookTitle: '해리포터', quantity: 6, availableQuantity: 4, price: null },
    { locationId: 8, bookTitle: '1984', quantity: 5, availableQuantity: 3, price: null },
    { locationId: 8, bookTitle: '노인과 바다', quantity: 7, availableQuantity: 5, price: null },
    // 송파도서관 (id: 9)
    { locationId: 9, bookTitle: '해리포터', quantity: 8, availableQuantity: 6, price: null },
    { locationId: 9, bookTitle: '위대한 개츠비', quantity: 6, availableQuantity: 5, price: null },
    { locationId: 9, bookTitle: '오만과 편견', quantity: 7, availableQuantity: 6, price: null },
    // 은평도서관 (id: 10)
    { locationId: 10, bookTitle: '1984', quantity: 4, availableQuantity: 3, price: null },
    { locationId: 10, bookTitle: '노인과 바다', quantity: 5, availableQuantity: 4, price: null },
    { locationId: 10, bookTitle: '위대한 개츠비', quantity: 6, availableQuantity: 5, price: null },
    // 강동도서관 (id: 11)
    { locationId: 11, bookTitle: '해리포터', quantity: 7, availableQuantity: 5, price: null },
    { locationId: 11, bookTitle: '오만과 편견', quantity: 5, availableQuantity: 4, price: null },
    // 교보문고 광화문점 (id: 12)
    { locationId: 12, bookTitle: '해리포터', quantity: 20, availableQuantity: 20, price: 15000 },
    { locationId: 12, bookTitle: '1984', quantity: 18, availableQuantity: 18, price: 15000 },
    { locationId: 12, bookTitle: '노인과 바다', quantity: 15, availableQuantity: 15, price: 12000 },
    { locationId: 12, bookTitle: '위대한 개츠비', quantity: 16, availableQuantity: 16, price: 13000 },
    { locationId: 12, bookTitle: '오만과 편견', quantity: 14, availableQuantity: 14, price: 14000 },
    // 반디앤루니스 강남점 (id: 13)
    { locationId: 13, bookTitle: '해리포터', quantity: 12, availableQuantity: 12, price: 14800 },
    { locationId: 13, bookTitle: '1984', quantity: 10, availableQuantity: 10, price: 14800 },
    { locationId: 13, bookTitle: '위대한 개츠비', quantity: 11, availableQuantity: 11, price: 12800 },
    { locationId: 13, bookTitle: '오만과 편견', quantity: 9, availableQuantity: 9, price: 13800 },
    // 영풍문고 신촌점 (id: 14)
    { locationId: 14, bookTitle: '해리포터', quantity: 13, availableQuantity: 13, price: 14500 },
    { locationId: 14, bookTitle: '노인과 바다', quantity: 11, availableQuantity: 11, price: 12000 },
    { locationId: 14, bookTitle: '위대한 개츠비', quantity: 10, availableQuantity: 10, price: 13000 },
    // 교보문고 잠실점 (id: 15)
    { locationId: 15, bookTitle: '해리포터', quantity: 16, availableQuantity: 16, price: 15000 },
    { locationId: 15, bookTitle: '1984', quantity: 14, availableQuantity: 14, price: 15000 },
    { locationId: 15, bookTitle: '노인과 바다', quantity: 13, availableQuantity: 13, price: 12000 },
    { locationId: 15, bookTitle: '오만과 편견', quantity: 12, availableQuantity: 12, price: 14000 },
    // 예스24 스토어 (id: 16)
    { locationId: 16, bookTitle: '해리포터', quantity: 9, availableQuantity: 9, price: 14700 },
    { locationId: 16, bookTitle: '1984', quantity: 8, availableQuantity: 8, price: 14700 },
    { locationId: 16, bookTitle: '위대한 개츠비', quantity: 10, availableQuantity: 10, price: 12700 },
    // 알라딘 강남점 (id: 17)
    { locationId: 17, bookTitle: '1984', quantity: 7, availableQuantity: 7, price: 8200 },
    { locationId: 17, bookTitle: '노인과 바다', quantity: 9, availableQuantity: 9, price: 7200 },
    { locationId: 17, bookTitle: '위대한 개츠비', quantity: 8, availableQuantity: 8, price: 7700 },
    { locationId: 17, bookTitle: '오만과 편견', quantity: 6, availableQuantity: 6, price: 8700 },
    // 영풍문고 목동점 (id: 18)
    { locationId: 18, bookTitle: '해리포터', quantity: 11, availableQuantity: 11, price: 14500 },
    { locationId: 18, bookTitle: '노인과 바다', quantity: 9, availableQuantity: 9, price: 12000 },
    { locationId: 18, bookTitle: '위대한 개츠비', quantity: 10, availableQuantity: 10, price: 13000 },
    // 성해 서점 (id: 19)
    { locationId: 19, bookTitle: '성해', quantity: 15, availableQuantity: 15, price: 18000 },
    { locationId: 19, bookTitle: '혼모노', quantity: 12, availableQuantity: 12, price: 16000 },
    { locationId: 19, bookTitle: '해리포터', quantity: 8, availableQuantity: 8, price: 15000 },
    { locationId: 19, bookTitle: '1984', quantity: 10, availableQuantity: 10, price: 15000 },
    // 혼모노 도서관 (id: 20)
    { locationId: 20, bookTitle: '혼모노', quantity: 5, availableQuantity: 3, price: null },
    { locationId: 20, bookTitle: '성해', quantity: 4, availableQuantity: 2, price: null },
    { locationId: 20, bookTitle: '위대한 개츠비', quantity: 6, availableQuantity: 5, price: null },
    { locationId: 20, bookTitle: '노인과 바다', quantity: 7, availableQuantity: 6, price: null },
    // 성해 도서관 (id: 21)
    { locationId: 21, bookTitle: '성해', quantity: 8, availableQuantity: 6, price: null },
    { locationId: 21, bookTitle: '혼모노', quantity: 6, availableQuantity: 4, price: null },
    { locationId: 21, bookTitle: '해리포터', quantity: 9, availableQuantity: 7, price: null },
    { locationId: 21, bookTitle: '오만과 편견', quantity: 5, availableQuantity: 4, price: null },
    // 혼모노 서점 (id: 22)
    { locationId: 22, bookTitle: '혼모노', quantity: 20, availableQuantity: 20, price: 16000 },
    { locationId: 22, bookTitle: '성해', quantity: 18, availableQuantity: 18, price: 18000 },
    { locationId: 22, bookTitle: '1984', quantity: 15, availableQuantity: 15, price: 15000 },
    { locationId: 22, bookTitle: '위대한 개츠비', quantity: 14, availableQuantity: 14, price: 13000 },
  ]

  // 특정 책의 재고가 있는 위치 찾기
  const getLocationsWithBook = (book) => {
    if (!book) return dummyLocations

    // 책 제목으로 매칭 (간단한 예시, 실제로는 ISBN 등으로 매칭)
    const bookTitle = book.title.toLowerCase()
    const matchingInventory = dummyInventory.filter(inv =>
      inv.bookTitle.toLowerCase().includes(bookTitle) ||
      bookTitle.includes(inv.bookTitle.toLowerCase())
    )

    const locationIds = [...new Set(matchingInventory.map(inv => inv.locationId))]
    return dummyLocations.filter(loc => locationIds.includes(loc.id))
  }

  // 특정 위치와 책의 재고 정보 가져오기
  const getInventory = (locationId, book) => {
    if (!book) return null

    const bookTitle = book.title.toLowerCase()
    return dummyInventory.find(inv =>
      inv.locationId === locationId &&
      (inv.bookTitle.toLowerCase().includes(bookTitle) ||
        bookTitle.includes(inv.bookTitle.toLowerCase()))
    )
  }

  // Initialize map - window.kakao.maps.load() 콜백 안에서만 사용
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 50 // 10초 동안 시도 (200ms * 50)
    let isInitialized = false

    const initMap = () => {
      if (isInitialized) return

      // 스크립트가 로드되었는지 확인
      if (!window.kakaoMapScriptLoaded && retryCount < 20) {
        if (retryCount % 5 === 0) {
          console.log(`⏳ Waiting for script to load... (${retryCount}/20)`)
        }
        retryCount++
        setTimeout(initMap, 200)
        return
      }

      // 스크립트가 로드되지 않았으면 에러
      if (!window.kakaoMapScriptLoaded) {
        console.error('❌ Kakao Map SDK script not loaded')
        console.error('Possible causes:')
        console.error('1. API key is invalid')
        console.error('2. Domain not registered:', window.location.origin)
        console.error('3. Network error - check browser Network tab')
        setIsMapLoaded(false)
        return
      }

      // SDK가 아직 로드되지 않았으면 재시도
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.load) {
        if (retryCount < maxRetries) {
          if (retryCount % 10 === 0) {
            console.log(`⏳ Waiting for SDK to initialize... (${retryCount}/${maxRetries})`)
            console.log('window.kakao:', !!window.kakao)
            console.log('window.kakao.maps:', !!window.kakao?.maps)
            console.log('window.kakao.maps.load:', !!window.kakao?.maps?.load)
          }
          retryCount++
          setTimeout(initMap, 200)
        } else {
          console.error('❌ Kakao Map SDK not available after', maxRetries, 'attempts')
          console.error('Script loaded:', window.kakaoMapScriptLoaded)
          console.error('window.kakao:', window.kakao)
          console.error('window.kakao.maps:', window.kakao?.maps)
          console.error('Current origin:', window.location.origin)
          console.error('Check:')
          console.error('1. API key is correct in index.html')
          console.error('2. Domain is registered in Kakao Developers console')
          console.error('3. Check browser Network tab for script loading errors')
          setIsMapLoaded(false)
        }
        return
      }

      // window.kakao.maps.load() 콜백 안에서만 지도 생성
      window.kakao.maps.load(() => {
        if (isInitialized) return

        const kakao = window.kakao
        const container = mapRef.current

        if (!container) {
          console.error('❌ Map container not found')
          setIsMapLoaded(false)
          return
        }

        try {
          isInitialized = true

          // window.kakao.maps.load() 콜백 안에서만 사용
          const options = {
            center: new kakao.maps.LatLng(37.5665, 126.9780),
            level: 5
          }

          const map = new kakao.maps.Map(container, options)
          mapInstanceRef.current = map

          console.log('✅ Map created successfully')
          setIsMapLoaded(true)

          // 여기부터 services 사용 가능
          // const ps = new kakao.maps.services.Places();

          kakao.maps.event.addListener(map, 'tilesloaded', () => {
            setLocations(dummyLocations)
            setFilteredLocations(dummyLocations)
            displayMarkers(dummyLocations, null)
          })

        } catch (error) {
          console.error('❌ Error creating map:', error)
          setIsMapLoaded(false)
          isInitialized = false
        }
      })
    }

    // 초기화 시작
    initMap()

    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null))
        markersRef.current = []
      }
    }
  }, [])


  // Display markers on map with InfoWindow
  const displayMarkers = (locationsToShow, currentSelectedBook = null) => {
    if (!window.kakao || !window.kakao.maps) return

    // Remove existing markers and info windows
    markersRef.current.forEach(marker => {
      if (marker.infoWindow) {
        marker.infoWindow.close()
      }
      marker.setMap(null)
    })
    markersRef.current = []

    if (!mapInstanceRef.current) return

    const kakao = window.kakao

    locationsToShow.forEach((location) => {
      // Create marker image
      const imageSrc = location.type === 'library'
        ? 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'
        : 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_orange.png'
      const imageSize = new kakao.maps.Size(24, 35)
      const imageOption = { offset: new kakao.maps.Point(12, 35) }
      const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption)

      // Create marker
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(location.lat, location.lng),
        image: markerImage,
        map: mapInstanceRef.current
      })

      // Get inventory for this location and book
      const inventory = currentSelectedBook ? getInventory(location.id, currentSelectedBook) : null

      // Create InfoWindow content
      let infoContent = `
        <div style="padding:12px;min-width:200px;max-width:300px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="font-weight:bold;font-size:16px;margin-bottom:6px;color:#1f2937;">${location.name}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">${location.address || '주소 정보 없음'}</div>
          ${location.tel ? `<div style="font-size:11px;color:#6b7280;margin-bottom:4px;">📞 ${location.tel}</div>` : ''}
          ${location.fax ? `<div style="font-size:11px;color:#6b7280;margin-bottom:4px;">📠 ${location.fax}</div>` : ''}
          ${location.homepage ? `<div style="font-size:11px;color:#3b82f6;margin-bottom:4px;"><a href="${location.homepage}" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">🌐 홈페이지</a></div>` : ''}
          ${location.operatingTime ? `<div style="font-size:11px;color:#6b7280;margin-bottom:4px;">🕐 ${location.operatingTime}</div>` : ''}
          ${location.closed ? `<div style="font-size:11px;color:#ef4444;margin-bottom:4px;">🚫 휴관일: ${location.closed}</div>` : ''}
          <div style="font-size:11px;color:#9ca3af;margin-bottom:10px;padding:4px 8px;background:#f3f4f6;border-radius:4px;display:inline-block;">
            ${location.type === 'library' ? '📚 도서관' : '📖 서점'}
          </div>
      `

      // If a book is selected and inventory exists, show inventory info
      if (currentSelectedBook && inventory) {
        infoContent += `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;">
            <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">📖 ${currentSelectedBook.title}</div>
            <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">${currentSelectedBook.author || ''}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:12px;color:#4b5563;">총 재고:</span>
              <span style="font-weight:600;color:#1f2937;">${inventory.quantity}권</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:12px;color:#4b5563;">${location.type === 'library' ? '대출 가능:' : '구매 가능:'}</span>
              <span style="font-weight:600;color:#059669;">${inventory.availableQuantity}권</span>
            </div>
        `
        if (inventory.price) {
          infoContent += `
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;color:#4b5563;">가격:</span>
              <span style="font-weight:600;color:#dc2626;">${inventory.price.toLocaleString()}원</span>
            </div>
          `
        }
        infoContent += `</div>`
      } else if (currentSelectedBook) {
        // Selected book but not available at this location
        infoContent += `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;">
            <div style="font-size:12px;color:#ef4444;">❌ ${currentSelectedBook.title} 재고 없음</div>
          </div>
        `
      }

      infoContent += `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;">
          <button 
            id="close-info-${location.id}"
            style="background:#6b7280;color:white;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;transition:background 0.2s;"
            onmouseover="this.style.background='#4b5563'"
            onmouseout="this.style.background='#6b7280'"
          >
            닫기
          </button>
        </div>
      </div>`

      // Create InfoWindow
      const infoWindow = new kakao.maps.InfoWindow({
        content: infoContent,
        removable: true
      })

      let isOpen = false

      // Add click event to marker
      kakao.maps.event.addListener(marker, 'click', () => {
        if (isOpen && marker.infoWindow) {
          marker.infoWindow.close()
          isOpen = false
        } else {
          // Close all other info windows
          markersRef.current.forEach(m => {
            if (m !== marker && m.infoWindow) {
              m.infoWindow.close()
              m.isOpen = false
            }
          })
          // Open this info window
          infoWindow.open(mapInstanceRef.current, marker)
          isOpen = true

          // Add close button event listener
          setTimeout(() => {
            const closeBtn = document.getElementById(`close-info-${location.id}`)
            if (closeBtn) {
              closeBtn.addEventListener('click', () => {
                infoWindow.close()
                isOpen = false
                marker.isOpen = false
              })
            }
          }, 100)
        }
        marker.infoWindow = infoWindow
        marker.isOpen = isOpen
      })

      // Listen for close event
      kakao.maps.event.addListener(infoWindow, 'close', () => {
        isOpen = false
        marker.isOpen = false
      })

      // Close info window when map is clicked
      kakao.maps.event.addListener(mapInstanceRef.current, 'click', () => {
        if (marker.infoWindow) {
          marker.infoWindow.close()
          marker.isOpen = false
        }
      })

      marker.infoWindow = infoWindow
      markersRef.current.push(marker)
    })

    // Adjust map bounds to show all markers
    if (locationsToShow.length > 0) {
      const bounds = new kakao.maps.LatLngBounds()
      locationsToShow.forEach(location => {
        bounds.extend(new kakao.maps.LatLng(location.lat, location.lng))
      })
      mapInstanceRef.current.setBounds(bounds)
    }
  }

  // Handle book search - 책 선택 시 해당 책의 재고가 있는 위치만 표시
  const handleBookSearch = async (book) => {
    setSelectedBook(book)
    setLibraryError(null)
    
    // ISBN이 있으면 data4library API로 실제 도서관 검색
    const isbn = book.isbn13 || book.isbn10 || book.isbn
    if (isbn) {
      setIsLoadingLibraries(true)
      try {
        const libraries = await searchLibrariesByBook(isbn)
        
        if (libraries.length > 0) {
          // 좌표가 없는 도서관의 경우 주소를 좌표로 변환
          const locationsWithCoords = await Promise.all(
            libraries.map(async (lib) => {
              let lat = lib.latitude
              let lng = lib.longitude
              
              // 좌표가 없고 주소가 있으면 Geocoding 수행
              if ((!lat || !lng) && lib.address && window.kakao && window.kakao.maps) {
                try {
                  const coords = await geocodeAddress(lib.address)
                  lat = coords.lat
                  lng = coords.lng
                } catch (error) {
                  console.warn(`주소 변환 실패: ${lib.address}`, error)
                  // 기본값 사용 (서울 중심)
                  lat = lat || 37.5665
                  lng = lng || 126.9780
                }
              } else if (!lat || !lng) {
                // 좌표와 주소가 모두 없으면 기본값 사용
                lat = 37.5665
                lng = 126.9780
              }
              
              return {
                id: `lib-${lib.libCode}`,
                name: lib.libName,
                type: 'library',
                lat: lat,
                lng: lng,
                address: lib.address || '',
                tel: lib.tel || '',
                fax: lib.fax || '',
                homepage: lib.homepage || '',
                closed: lib.closed || '',
                operatingTime: lib.operatingTime || '',
                libCode: lib.libCode,
              }
            })
          )
          
          setLocations(locationsWithCoords)
          setFilteredLocations(locationsWithCoords)
          
          // 지도에 마커 표시
          if (mapInstanceRef.current && window.kakao && window.kakao.maps) {
            displayMarkers(locationsWithCoords, book)
          }
        } else {
          // 도서관이 없으면 더미 데이터 사용
          const locationsWithBook = getLocationsWithBook(book)
          setLocations(locationsWithBook)
          setFilteredLocations(locationsWithBook)
          
          if (mapInstanceRef.current && window.kakao && window.kakao.maps) {
            displayMarkers(locationsWithBook, book)
          }
          
          setLibraryError('해당 책을 보유한 도서관을 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('도서관 검색 오류:', error)
        setLibraryError(error.message || '도서관 검색 중 오류가 발생했습니다.')
        
        // 오류 발생 시 더미 데이터 사용
        const locationsWithBook = getLocationsWithBook(book)
        setLocations(locationsWithBook)
        setFilteredLocations(locationsWithBook)
        
        if (mapInstanceRef.current && window.kakao && window.kakao.maps) {
          displayMarkers(locationsWithBook, book)
        }
      } finally {
        setIsLoadingLibraries(false)
      }
    } else {
      // ISBN이 없으면 더미 데이터 사용
      const locationsWithBook = getLocationsWithBook(book)
      setLocations(locationsWithBook)
      setFilteredLocations(locationsWithBook)

      // 지도에 마커 표시 (재고 정보 포함)
      if (mapInstanceRef.current && window.kakao && window.kakao.maps) {
        displayMarkers(locationsWithBook, book)
      }
      
      setLibraryError('ISBN 정보가 없어 실제 도서관 검색을 할 수 없습니다.')
    }
  }

  // Handle filter change
  useEffect(() => {
    let filtered = locations

    if (filterType === 'library') {
      filtered = filtered.filter(loc => loc.type === 'library')
    } else if (filterType === 'bookstore') {
      filtered = filtered.filter(loc => loc.type === 'bookstore')
    }

    setFilteredLocations(filtered)
    if (mapInstanceRef.current && window.kakao && window.kakao.maps) {
      displayMarkers(filtered, selectedBook)
    }
  }, [filterType, locations, selectedBook])

  // 검색 결과가 있으면 검색 결과 사용, 없으면 빈 배열
  const filteredBooks = searchQuery.trim() ? searchResults : []

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">도서관/서점 찾기</h1>
          <p className="text-gray-600">책을 검색하여 대출 가능한 도서관이나 구매 가능한 서점을 찾아보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Search and Filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Book Search */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">책 검색</h2>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="책 제목 또는 저자 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                    <span className="ml-2 text-sm text-gray-500">검색 중...</span>
                  </div>
                ) : !searchQuery.trim() ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-2">책 제목 또는 저자를 입력하세요</p>
                    <p className="text-xs text-gray-400">Google Books API를 통해 검색됩니다</p>
                    {!import.meta.env.VITE_Googlebooks && !import.meta.env.VITE_GOOGLE_BOOKS_API_KEY && (
                      <p className="text-xs text-red-500 mt-2">⚠️ API 키가 설정되지 않았습니다. 환경 변수에 VITE_Googlebooks를 설정해주세요.</p>
                    )}
                  </div>
                ) : filteredBooks.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-2">검색 결과가 없습니다</p>
                    <p className="text-xs text-gray-400">다른 검색어를 시도해보세요</p>
                    {!import.meta.env.VITE_GOOGLE_BOOKS_API_KEY && (
                      <p className="text-xs text-red-500 mt-2">⚠️ API 키가 설정되지 않았습니다.</p>
                    )}
                  </div>
                ) : (
                  filteredBooks.map(book => (
                    <button
                      key={book.id}
                      onClick={() => handleBookSearch(book)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${selectedBook?.id === book.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                        }`}
                    >
                      {book.thumbnail && (
                        <div className="flex items-center gap-3">
                          <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm line-clamp-1">{book.title}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{book.author}</div>
                          </div>
                        </div>
                      )}
                      {!book.thumbnail && (
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm line-clamp-1">{book.title}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{book.author}</div>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">필터</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-all ${filterType === 'all'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilterType('library')}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-all ${filterType === 'library'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  도서관
                </button>
                <button
                  onClick={() => setFilterType('bookstore')}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-all ${filterType === 'bookstore'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  서점
                </button>
              </div>
            </div>

            {/* List Toggle */}
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <button
                onClick={() => setShowList(!showList)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {showList ? '목록 숨기기' : '목록 보기'}
              </button>
            </div>
          </div>

          {/* Right Side - Map and List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border-2 border-blue-200 overflow-hidden relative">
              {!isMapLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/90 z-20 p-6">
                  <div className="text-center max-w-md">
                    <div className="mb-4 animate-spin">
                      <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">지도를 불러오는 중...</h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      카카오맵 API를 로딩하고 있습니다. 잠시만 기다려주세요.
                    </p>
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-left">
                      <p className="text-sm text-red-800 font-bold mb-3">🚨 카카오맵 로딩 실패</p>
                      <div className="bg-white p-3 rounded border border-red-200 mb-3">
                        <p className="text-xs text-red-700 font-semibold mb-2">현재 도메인:</p>
                        <p className="text-xs text-red-900 font-mono bg-gray-100 p-2 rounded">{window.location.origin}</p>
                      </div>
                      <p className="text-xs text-red-800 font-semibold mb-2">해결 방법:</p>
                      <ol className="text-xs text-red-700 space-y-2 list-decimal list-inside mb-3">
                        <li className="mb-2">
                          <strong>카카오 개발자 콘솔</strong> 접속:
                          <a href="https://developers.kakao.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">https://developers.kakao.com</a>
                        </li>
                        <li className="mb-2">
                          <strong>내 애플리케이션</strong> &gt; <strong>앱 키</strong> &gt; <strong>JavaScript 키</strong> 클릭
                        </li>
                        <li className="mb-2">
                          <strong>JavaScript SDK 도메인</strong> 섹션에서:
                          <ul className="ml-6 mt-1 list-disc">
                            <li>기존: <code className="bg-gray-100 px-1 rounded">https://booklens-two.vercel.app/map</code> ❌ (경로 포함 - 잘못됨)</li>
                            <li>수정: <code className="bg-gray-100 px-1 rounded">https://booklens-two.vercel.app</code> ✅ (경로 제거)</li>
                            <li>추가: <code className="bg-gray-100 px-1 rounded">http://localhost:5173</code> ✅ (로컬 개발용)</li>
                          </ul>
                        </li>
                        <li>저장 후 페이지 새로고침 (Ctrl+R 또는 Cmd+R)</li>
                      </ol>
                      <p className="text-xs text-red-600 mt-3 font-semibold">⚠️ 중요: 도메인에 경로(/map)를 포함하면 안 됩니다!</p>
                    </div>
                    <a
                      href="https://developers.kakao.com/docs/latest/ko/getting-started/sdk-js"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md mt-4"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      카카오맵 API 설정 가이드
                    </a>
                  </div>
                </div>
              )}
              <div
                ref={mapRef}
                className="w-full h-[500px]"
                style={{
                  minHeight: '500px',
                  height: '500px',
                  width: '100%',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </div>

            {/* Location List */}
            {showList && (
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedBook ? `"${selectedBook.title}" 재고 위치` : '검색 결과'} ({filteredLocations.length}개)
                </h2>
                {selectedBook && (
                  <div className="mb-4 p-3 bg-brand-50 rounded-lg border border-brand-200">
                    <div className="text-sm text-gray-600 mb-1">검색 중인 책:</div>
                    <div className="font-semibold text-gray-900">{selectedBook.title}</div>
                    <div className="text-xs text-gray-500">{selectedBook.author}</div>
                    {selectedBook.isbn13 && (
                      <div className="text-xs text-gray-400 mt-1">ISBN-13: {selectedBook.isbn13}</div>
                    )}
                  </div>
                )}
                {isLoadingLibraries && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-blue-700">도서관 검색 중...</span>
                    </div>
                  </div>
                )}
                {libraryError && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-800">⚠️ {libraryError}</div>
                    {!import.meta.env.VITE_DATA4LIBRARY_API_KEY && (
                      <div className="text-xs text-yellow-600 mt-1">
                        API 키가 설정되지 않았습니다. .env 파일에 VITE_DATA4LIBRARY_API_KEY를 설정해주세요.
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredLocations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {selectedBook ? '해당 책을 보유한 장소가 없습니다' : '책을 검색해주세요'}
                    </p>
                  ) : (
                    filteredLocations.map(location => {
                      const inventory = selectedBook ? getInventory(location.id, selectedBook) : null
                      return (
                        <div
                          key={location.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-gray-50 transition-all cursor-pointer"
                          onClick={() => {
                            if (mapInstanceRef.current && window.kakao && window.kakao.maps) {
                              const moveLatLon = new window.kakao.maps.LatLng(location.lat, location.lng)
                              mapInstanceRef.current.setCenter(moveLatLon)
                              mapInstanceRef.current.setLevel(3)

                              // Open info window
                              const marker = markersRef.current.find(m => {
                                const pos = m.getPosition()
                                return pos.getLat() === location.lat && pos.getLng() === location.lng
                              })
                              if (marker && marker.infoWindow) {
                                markersRef.current.forEach(m => {
                                  if (m.infoWindow) m.infoWindow.close()
                                })
                                marker.infoWindow.open(mapInstanceRef.current, marker)
                              }
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{location.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${location.type === 'library'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                                  }`}>
                                  {location.type === 'library' ? '도서관' : '서점'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{location.address || '주소 정보 없음'}</p>
                              {location.tel && (
                                <p className="text-xs text-gray-500 mt-1">📞 {location.tel}</p>
                              )}
                              {location.fax && (
                                <p className="text-xs text-gray-500 mt-1">📠 {location.fax}</p>
                              )}
                              {location.homepage && (
                                <p className="text-xs text-blue-600 mt-1">
                                  <a href={location.homepage} target="_blank" rel="noopener noreferrer" className="underline">
                                    🌐 홈페이지
                                  </a>
                                </p>
                              )}
                              {location.operatingTime && (
                                <p className="text-xs text-gray-500 mt-1">🕐 {location.operatingTime}</p>
                              )}
                              {location.closed && (
                                <p className="text-xs text-red-600 mt-1">🚫 휴관일: {location.closed}</p>
                              )}
                              {selectedBook && inventory && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-gray-600">
                                    총 재고: <span className="font-semibold text-gray-900">{inventory.quantity}권</span>
                                  </p>
                                  <p className="text-xs text-brand-600">
                                    {location.type === 'library' ? '대출' : '구매'} 가능: <span className="font-semibold">{inventory.availableQuantity}권</span>
                                    {inventory.price && (
                                      <span className="ml-2 text-red-600">({inventory.price.toLocaleString()}원)</span>
                                    )}
                                  </p>
                                </div>
                              )}
                              {selectedBook && !inventory && (
                                <p className="text-xs text-red-600 mt-2">❌ 재고 없음</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapPage

