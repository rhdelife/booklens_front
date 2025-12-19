/**
 * 독서 기록 유틸리티
 * 날짜별 독서 기록을 백엔드에 저장하고 관리합니다.
 */

import { readingSessionAPI } from '../services/api'

/**
 * 독서 세션을 날짜별 기록에 추가 (백엔드에 저장)
 * @param {number} bookId - 책 ID
 * @param {string} bookTitle - 책 제목
 * @param {string} bookAuthor - 책 저자
 * @param {string} bookThumbnail - 책 썸네일 URL
 * @param {number} pagesRead - 읽은 페이지 수
 * @param {number} duration - 독서 시간 (초)
 * @param {Date} startTime - 세션 시작 시간
 */
export const saveReadingSession = async (bookId, bookTitle, bookAuthor, bookThumbnail, pagesRead, duration, startTime) => {
  try {
    const sessionData = {
      bookId,
      bookTitle,
      bookAuthor,
      bookThumbnail: bookThumbnail || '',
      pagesRead,
      duration,
      startTime: startTime.toISOString()
    }

    // 백엔드에 저장 시도
    try {
      await readingSessionAPI.saveReadingSession(sessionData)
    } catch (error) {
      console.warn('Failed to save reading session to backend, using localStorage as fallback:', error)
      // 백엔드 실패 시 localStorage에 저장 (폴백)
      const dateString = new Date(startTime).toISOString().split('T')[0]
      const savedHistory = localStorage.getItem('readingHistory')
      const history = savedHistory ? JSON.parse(savedHistory) : {}

      if (!history[dateString]) {
        history[dateString] = {
          date: dateString,
          totalTime: 0,
          sessions: []
        }
      }

      history[dateString].sessions.push({
        bookId,
        bookTitle,
        bookAuthor,
        bookThumbnail,
        pagesRead,
        duration,
        startTime: startTime.toISOString()
      })

      history[dateString].totalTime += duration
      localStorage.setItem('readingHistory', JSON.stringify(history))
    }
  } catch (error) {
    console.error('Failed to save reading session:', error)
  }
}

/**
 * 날짜별 독서 기록 가져오기 (백엔드에서 조회)
 * @param {string} dateString - 날짜 문자열 (YYYY-MM-DD)
 * @returns {Promise<object|null>} - 해당 날짜의 독서 기록
 */
export const getReadingHistoryByDate = async (dateString) => {
  try {
    // 백엔드에서 조회 시도
    try {
      const response = await readingSessionAPI.getDateHistory(dateString)
      return response.data || null
    } catch (error) {
      console.warn('Failed to get reading history from backend, using localStorage:', error)
      // 백엔드 실패 시 localStorage에서 조회 (폴백)
      const savedHistory = localStorage.getItem('readingHistory')
      if (!savedHistory) return null

      const history = JSON.parse(savedHistory)
      return history[dateString] || null
    }
  } catch (error) {
    console.error('Failed to get reading history:', error)
    return null
  }
}

/**
 * 달력용 독서 기록 가져오기 (백엔드에서 조회)
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 * @returns {Promise<object>} - 날짜별 독서 기록 객체
 */
export const getCalendarHistory = async (year, month) => {
  try {
    // 백엔드에서 조회 시도
    try {
      const response = await readingSessionAPI.getCalendarData(year, month)
      return response.data || {}
    } catch (error) {
      console.warn('Failed to get calendar history from backend, using localStorage:', error)
      // 백엔드 실패 시 localStorage에서 조회 (폴백)
      const savedHistory = localStorage.getItem('readingHistory')
      if (!savedHistory) return {}

      const history = JSON.parse(savedHistory)
      // 해당 월의 데이터만 필터링
      const filteredHistory = {}
      Object.keys(history).forEach(date => {
        const dateObj = new Date(date)
        if (dateObj.getFullYear() === year && dateObj.getMonth() + 1 === month) {
          filteredHistory[date] = history[date]
        }
      })
      return filteredHistory
    }
  } catch (error) {
    console.error('Failed to get calendar history:', error)
    return {}
  }
}

