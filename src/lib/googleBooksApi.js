/**
 * Google Books API를 사용하여 책 정보를 가져오는 함수
 */

const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_Googlebooks || import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes'

// API 키 확인
const hasValidApiKey = () => {
  return GOOGLE_BOOKS_API_KEY &&
    GOOGLE_BOOKS_API_KEY !== 'YOUR_API_KEY' &&
    GOOGLE_BOOKS_API_KEY.trim() !== ''
}

/**
 * 한국어 책 필터링 함수
 * 한국어로 제공되는 문학/비문학 서적만 허용 (완화된 필터)
 */
const filterKoreanBooks = (book) => {
  const volumeInfo = book.volumeInfo || {}
  
  // 1. 언어 필터: 한국어 우선, 언어 정보가 없으면 제목/저자로 판단
  const language = volumeInfo.language || ''
  const title = volumeInfo.title || ''
  const authors = volumeInfo.authors || []
  const hasKoreanChar = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) || 
                       authors.some(author => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(author))
  
  // 언어 정보가 있으면 한국어만 허용, 없으면 한국어 문자가 있으면 허용
  if (language && language !== 'ko' && language !== 'ko-KR') {
    // 언어가 명시되어 있고 한국어가 아니면 제외
    // 단, 한국어 문자가 있으면 허용 (번역서 등)
    if (!hasKoreanChar) {
      return false
    }
  }
  
  // 2. 인쇄 타입 필터: 책만 허용 (잡지, 논문 제외)
  const printType = book.saleInfo?.printType || volumeInfo.printType || 'BOOK'
  if (printType && printType !== 'BOOK') {
    return false
  }
  
  // 3. 카테고리 필터: 잡지, 논문, 학술지 제외
  const categories = volumeInfo.categories || []
  const excludedCategories = [
    'magazine', 'journal', 'periodical', 'newspaper', 'academic',
    'thesis', 'dissertation', 'research', 'paper', '잡지', '학술지',
    '논문', '연구', '보고서', 'report', 'proceedings'
  ]
  
  const hasExcludedCategory = categories.some(cat => {
    const lowerCat = cat.toLowerCase()
    return excludedCategories.some(excluded => lowerCat.includes(excluded))
  })
  
  if (hasExcludedCategory) {
    return false
  }
  
  // 4. 필수 정보 확인: 제목만 필수, 이미지는 선택적
  if (!title) {
    return false
  }
  
  return true
}

/**
 * 한국어 검색어로 책 검색 (기본 필터 적용)
 */
const buildSearchQuery = (baseQuery, additionalFilters = {}) => {
  // 한국어 책 검색을 위한 기본 파라미터
  const params = new URLSearchParams({
    q: baseQuery,
    langRestrict: 'ko', // 한국어로 제한
    printType: 'books', // 책만 (잡지, 논문 제외)
    maxResults: additionalFilters.maxResults || 10,
    ...additionalFilters
  })
  
  return params.toString()
}

/**
 * ISBN으로 책 정보 검색 (한국어 책 우선, 필터링 적용)
 * @param {string} isbn - ISBN 번호 (하이픈 포함/미포함 모두 가능)
 * @returns {Promise<Object>} 책 정보 객체
 */
export const searchBookByISBN = async (isbn) => {
  try {
    if (!hasValidApiKey()) {
      throw new Error('Google Books API 키가 설정되지 않았습니다. .env 파일에 VITE_Googlebooks 또는 VITE_GOOGLE_BOOKS_API_KEY를 설정해주세요.')
    }

    // ISBN에서 하이픈 제거
    const cleanISBN = isbn.replace(/-/g, '')

    const response = await fetch(
      `${GOOGLE_BOOKS_API_URL}?q=isbn:${cleanISBN}&langRestrict=ko&printType=books&key=${GOOGLE_BOOKS_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      throw new Error('해당 ISBN의 책을 찾을 수 없습니다.')
    }

    // 한국어 책 필터링된 결과 찾기
    let bookItem = data.items.find(item => filterKoreanBooks(item))
    
    // 필터링된 결과가 없으면 첫 번째 결과 사용 (사용자가 직접 입력한 ISBN이므로)
    if (!bookItem) {
      bookItem = data.items[0]
    }

    const book = bookItem.volumeInfo

    // 책 정보 파싱
    const bookInfo = {
      title: book.title || '',
      subtitle: book.subtitle || '',
      authors: book.authors || [],
      author: book.authors ? book.authors.join(', ') : '저자 미상',
      publisher: book.publisher || '',
      publishedDate: book.publishedDate || '',
      description: book.description || '',
      pageCount: book.pageCount || 0,
      categories: book.categories || [],
      thumbnail: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '',
      isbn10: book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || '',
      isbn13: book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || '',
      language: book.language || '',
      previewLink: book.previewLink || '',
      infoLink: book.infoLink || '',
    }

    return bookInfo
  } catch (error) {
    console.error('Google Books API 오류:', error)
    throw error
  }
}

/**
 * 제목으로 책 검색 (한국어 문학/비문학 서적만)
 * @param {string} query - 검색어 (제목, 저자 등)
 * @returns {Promise<Array>} 책 정보 배열
 */
export const searchBooks = async (query) => {
  try {
    if (!hasValidApiKey()) {
      console.warn('Google Books API 키가 설정되지 않았습니다. .env 파일에 VITE_Googlebooks 또는 VITE_GOOGLE_BOOKS_API_KEY를 설정해주세요.')
      return []
    }

    const queryString = buildSearchQuery(query, { maxResults: 10 })
    const response = await fetch(
      `${GOOGLE_BOOKS_API_URL}?${queryString}&key=${GOOGLE_BOOKS_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return []
    }

    // 한국어 책만 필터링
    return data.items
      .filter(item => filterKoreanBooks(item))
      .map(item => {
        const book = item.volumeInfo
        return {
          id: item.id || Date.now() + Math.random(),
          title: book.title || '',
          subtitle: book.subtitle || '',
          authors: book.authors || [],
          author: book.authors ? book.authors.join(', ') : '저자 미상',
          publisher: book.publisher || '',
          publishedDate: book.publishedDate || '',
          description: book.description || '',
          pageCount: book.pageCount || 0,
          categories: book.categories || [],
          thumbnail: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '',
          isbn10: book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || '',
          isbn13: book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || '',
          language: book.language || '',
          previewLink: book.previewLink || '',
          infoLink: book.infoLink || '',
        }
      })
  } catch (error) {
    console.error('Google Books API 오류:', error)
    throw error
  }
}

/**
 * 베스트셀러 책 가져오기 (한국어 문학/비문학 서적만)
 * @param {number} count - 가져올 책의 개수 (기본값: 6)
 * @returns {Promise<Array>} 책 정보 배열
 */
export const getBestsellers = async (count = 6) => {
  try {
    if (!hasValidApiKey()) {
      console.warn('Google Books API 키가 설정되지 않았습니다.')
      return []
    }

    // 한국 베스트셀러 관련 검색어
    const searchTerms = [
      '베스트셀러',
      '한국소설',
      '한국문학',
      '한국도서',
      '인기도서',
      '추천도서',
      '문학',
      '소설',
      '에세이',
      '인문학',
      '경제경영',
      '자기계발'
    ]
    
    const allBooks = []

    for (const term of searchTerms) {
      try {
        const queryString = buildSearchQuery(term, { maxResults: 10, orderBy: 'relevance' })
        const response = await fetch(
          `${GOOGLE_BOOKS_API_URL}?${queryString}&key=${GOOGLE_BOOKS_API_KEY}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.items) {
            data.items.forEach(item => {
              // 한국어 책 필터링
              if (filterKoreanBooks(item)) {
                const book = item.volumeInfo
                allBooks.push({
                  id: item.id || Date.now() + Math.random(),
                  title: book.title || '',
                  author: book.authors ? book.authors.join(', ') : '저자 미상',
                  thumbnail: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '',
                  cover: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '',
                })
              }
            })
          }
        }
      } catch (err) {
        console.error(`검색어 "${term}" 오류:`, err)
      }
    }

    // 중복 제거 및 무작위 섞기
    const uniqueBooks = Array.from(
      new Map(allBooks.map(book => [book.title, book])).values()
    ).sort(() => Math.random() - 0.5)

    return uniqueBooks.slice(0, count)
  } catch (error) {
    console.error('베스트셀러 가져오기 오류:', error)
    return [] // 에러 발생 시 빈 배열 반환
  }
}

/**
 * 신간 도서 가져오기 (한국어 문학/비문학 서적만)
 * @param {number} count - 가져올 책의 개수 (기본값: 4)
 * @returns {Promise<Array>} 책 정보 배열
 */
export const getNewReleases = async (count = 4) => {
  try {
    if (!hasValidApiKey()) {
      console.warn('Google Books API 키가 설정되지 않았습니다.')
      return []
    }

    const currentYear = new Date().getFullYear()
    // 한국 신간 도서 검색어
    const searchTerms = [
      `${currentYear} 신간`,
      `${currentYear - 1} 신간`,
      '신간도서',
      '신간소설',
      '신간문학',
      '최신도서',
      '새책'
    ]

    const allBooks = []

    for (const term of searchTerms) {
      try {
        const queryString = buildSearchQuery(term, { maxResults: 10, orderBy: 'newest' })
        const response = await fetch(
          `${GOOGLE_BOOKS_API_URL}?${queryString}&key=${GOOGLE_BOOKS_API_KEY}`
        )

        if (response.ok) {
          const data = await response.json()
          if (data.items) {
            data.items.forEach(item => {
              // 한국어 책 필터링
              if (filterKoreanBooks(item)) {
                const book = item.volumeInfo
                const publishedYear = book.publishedDate ? new Date(book.publishedDate).getFullYear() : null
                // 최근 2년 이내 출간된 책만
                if (publishedYear && publishedYear >= currentYear - 2) {
                  allBooks.push({
                    id: item.id || Date.now() + Math.random(),
                    title: book.title || '',
                    author: book.authors ? book.authors.join(', ') : '저자 미상',
                    thumbnail: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '',
                    cover: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '',
                    publishedDate: book.publishedDate || '',
                  })
                }
              }
            })
          }
        }
      } catch (err) {
        console.error(`검색어 "${term}" 오류:`, err)
      }
    }

    // 중복 제거 및 발행일 기준 정렬
    const uniqueBooks = Array.from(
      new Map(allBooks.map(book => [book.title, book])).values()
    ).sort((a, b) => {
      const dateA = new Date(a.publishedDate || 0)
      const dateB = new Date(b.publishedDate || 0)
      return dateB - dateA
    })

    return uniqueBooks.slice(0, count)
  } catch (error) {
    console.error('신간 도서 가져오기 오류:', error)
    return [] // 에러 발생 시 빈 배열 반환
  }
}

/**
 * 책 ID로 상세 정보 가져오기
 * @param {string} bookId - Google Books API의 책 ID
 * @returns {Promise<Object>} 책 상세 정보
 */
export const getBookById = async (bookId) => {
  try {
    if (!hasValidApiKey()) {
      throw new Error('Google Books API 키가 설정되지 않았습니다. .env 파일에 VITE_Googlebooks 또는 VITE_GOOGLE_BOOKS_API_KEY를 설정해주세요.')
    }

    const response = await fetch(
      `${GOOGLE_BOOKS_API_URL}/${bookId}?key=${GOOGLE_BOOKS_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`)
    }

    const data = await response.json()
    const book = data.volumeInfo

    return {
      id: data.id,
      title: book.title || '',
      subtitle: book.subtitle || '',
      authors: book.authors || [],
      author: book.authors ? book.authors.join(', ') : 'Unknown Author',
      publisher: book.publisher || '',
      publishedDate: book.publishedDate || '',
      description: book.description || '',
      pageCount: book.pageCount || 0,
      pages: book.pageCount || 0,
      categories: book.categories || [],
      genre: book.categories?.[0] || '',
      thumbnail: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '',
      isbn10: book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || '',
      isbn13: book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || '',
      isbn: book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
        book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || '',
      language: book.language || '',
      previewLink: book.previewLink || '',
      infoLink: book.infoLink || '',
      year: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
      tableOfContents: book.tableOfContents || [],
      averageRating: book.averageRating || 0,
      ratingsCount: book.ratingsCount || 0,
    }
  } catch (error) {
    console.error('책 상세 정보 가져오기 오류:', error)
    throw error
  }
}


