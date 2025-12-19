/**
 * Reading Persona Badge 계산 유틸리티
 * 사용자의 독서 기록을 기반으로 페르소나를 할당합니다.
 */

// 장르 추론 키워드 (제목 기반 휴리스틱)
const GENRE_KEYWORDS = {
  nonfiction: ['심리', '경제', '경영', '역사', '철학', '과학', '기술', '자기계발', '인문', '사회', '정치', '비즈니스', '경영', '리더십', '성공', '투자', '재테크', '건강', '다이어트', '요리', '여행', '에세이', '인물', '전기', '회고록'],
  fiction: ['소설', '로맨스', '판타지', '무협', '라이트노벨', '만화', '웹툰'],
  mystery: ['추리', '미스터리', '스릴러', '서스펜스', '범죄', '탐정', '의문', '수사', '살인'],
  thriller: ['스릴러', '공포', '호러', '긴장', '서스펜스', '스파이', '액션'],
}

/**
 * 제목에서 장르를 추론합니다.
 */
const inferGenreFromTitle = (title) => {
  if (!title) return 'Unknown'
  
  const titleLower = title.toLowerCase()
  
  // Nonfiction 체크
  if (GENRE_KEYWORDS.nonfiction.some(keyword => titleLower.includes(keyword))) {
    return 'nonfiction'
  }
  
  // Mystery 체크
  if (GENRE_KEYWORDS.mystery.some(keyword => titleLower.includes(keyword))) {
    return 'mystery'
  }
  
  // Thriller 체크
  if (GENRE_KEYWORDS.thriller.some(keyword => titleLower.includes(keyword))) {
    return 'thriller'
  }
  
  // Fiction 체크
  if (GENRE_KEYWORDS.fiction.some(keyword => titleLower.includes(keyword))) {
    return 'fiction'
  }
  
  return 'Unknown'
}

/**
 * 페르소나 정의
 */
export const PERSONAS = {
  knowledge_collector: {
    id: 'knowledge_collector',
    name: '지식 수집가',
    icon: '📚',
    color: 'blue',
    description: '다양한 분야의 지식을 탐구하는 탐험가',
  },
  emotional_reader: {
    id: 'emotional_reader',
    name: '감성 소설러',
    icon: '💭',
    color: 'purple',
    description: '감정과 이야기에 깊이 빠져드는 독서가',
  },
  mystery_detective: {
    id: 'mystery_detective',
    name: '추리 탐정',
    icon: '🔍',
    color: 'indigo',
    description: '수수께끼와 미스터리를 즐기는 탐정',
  },
  completion_master: {
    id: 'completion_master',
    name: '완독 마스터',
    icon: '🏆',
    color: 'gold',
    description: '시작한 책을 끝까지 완주하는 완성주의자',
  },
  immersive_runner: {
    id: 'immersive_runner',
    name: '몰입 러너',
    icon: '⚡',
    color: 'green',
    description: '책 속 세계에 깊이 빠져드는 몰입형 독서가',
  },
  balanced_reader: {
    id: 'balanced_reader',
    name: '균형 잡힌 독서가',
    icon: '⚖️',
    color: 'gray',
    description: '다양한 장르를 균형있게 즐기는 독서가',
  },
}

/**
 * 사용자의 독서 기록을 분석하여 페르소나를 계산합니다.
 */
export const calculatePersona = (books, userId) => {
  if (!books || books.length === 0) {
    return PERSONAS.balanced_reader
  }

  // completed + reading 상태의 책만 분석
  const analyzedBooks = books.filter(
    book => book.status === 'completed' || book.status === 'reading'
  )

  if (analyzedBooks.length === 0) {
    return PERSONAS.balanced_reader
  }

  // 장르 분포 계산
  const genreCounts = {
    nonfiction: 0,
    fiction: 0,
    mystery: 0,
    thriller: 0,
    unknown: 0,
  }

  analyzedBooks.forEach(book => {
    const genre = book.genre || inferGenreFromTitle(book.title)
    if (genreCounts.hasOwnProperty(genre)) {
      genreCounts[genre]++
    } else {
      genreCounts.unknown++
    }
  })

  const total = analyzedBooks.length
  const nonfictionRatio = genreCounts.nonfiction / total
  const fictionRatio = genreCounts.fiction / total
  const mysteryRatio = genreCounts.mystery / total
  const thrillerRatio = genreCounts.thriller / total

  // 완독률 계산
  const completedCount = books.filter(book => book.status === 'completed').length
  const completionRate = books.length > 0 ? completedCount / books.length : 0

  // 평균 독서 시간 계산 (완독한 책 기준)
  const completedBooks = books.filter(book => book.status === 'completed' && book.totalReadingTime)
  const totalReadingTime = completedBooks.reduce((sum, book) => sum + (book.totalReadingTime || 0), 0)
  const avgReadingTimePerBook = completedBooks.length > 0 
    ? totalReadingTime / completedBooks.length 
    : 0

  // 페르소나 선택 로직 (우선순위 순)
  
  // 1. Nonfiction 비율 > 0.5
  if (nonfictionRatio > 0.5) {
    return PERSONAS.knowledge_collector
  }

  // 2. Fiction 비율 > 0.5
  if (fictionRatio > 0.5) {
    return PERSONAS.emotional_reader
  }

  // 3. Mystery/Thriller 비율이 가장 높음
  const maxGenreRatio = Math.max(mysteryRatio, thrillerRatio)
  if (maxGenreRatio > 0 && maxGenreRatio >= nonfictionRatio && maxGenreRatio >= fictionRatio) {
    return PERSONAS.mystery_detective
  }

  // 4. 완독률 > 0.7
  if (completionRate > 0.7) {
    return PERSONAS.completion_master
  }

  // 5. 평균 독서 시간이 높음 (1시간 이상 = 3600초)
  if (avgReadingTimePerBook > 3600) {
    return PERSONAS.immersive_runner
  }

  // 6. 기본값
  return PERSONAS.balanced_reader
}

/**
 * localStorage에서 페르소나를 가져오거나 계산하여 저장합니다.
 */
export const getOrCalculatePersona = (books, userId) => {
  const storageKey = `readingPersona:${userId || 'anonymous'}`
  
  try {
    // 저장된 페르소나가 있으면 반환
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const savedPersona = JSON.parse(saved)
      // 저장된 페르소나가 유효한지 확인
      if (PERSONAS[savedPersona.id]) {
        return savedPersona
      }
    }
  } catch (error) {
    console.error('Failed to load saved persona:', error)
  }

  // 계산하여 저장
  const persona = calculatePersona(books, userId)
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(persona))
  } catch (error) {
    console.error('Failed to save persona:', error)
  }

  return persona
}

/**
 * 페르소나를 강제로 재계산합니다.
 */
export const recalculatePersona = (books, userId) => {
  const persona = calculatePersona(books, userId)
  const storageKey = `readingPersona:${userId || 'anonymous'}`
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(persona))
  } catch (error) {
    console.error('Failed to save persona:', error)
  }

  return persona
}

