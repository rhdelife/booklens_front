/**
 * data4library API를 사용하여 도서관 정보를 가져오는 함수
 * API 문서: http://data4library.kr/api/libSrchByBook
 */

const DATA4LIBRARY_API_KEY = import.meta.env.VITE_DATA4LIBRARY_API_KEY
// 개발 환경에서는 프록시 사용, 프로덕션에서는 직접 호출
// API 엔드포인트 (정보나루 OpenAPI 스펙에 맞춤)
const DATA4LIBRARY_API_URL = import.meta.env.DEV
  ? '/api/data4library/libSrchByBook'
  : 'http://data4library.kr/api/libSrchByBook'

// API 키 확인
const hasValidApiKey = () => {
  return DATA4LIBRARY_API_KEY &&
    DATA4LIBRARY_API_KEY !== 'YOUR_API_KEY' &&
    DATA4LIBRARY_API_KEY.trim() !== ''
}

/**
 * ISBN으로 도서를 보유한 도서관 검색
 * @param {string} isbn - ISBN 번호 (13자리 또는 10자리)
 * @param {string} region - 지역코드 (선택사항, 예: "11" 서울)
 * @returns {Promise<Array>} 도서관 정보 배열
 */
export const searchLibrariesByBook = async (isbn, region = null) => {
  try {
    if (!isbn) {
      throw new Error('ISBN이 필요합니다.')
    }

    // ISBN에서 하이픈 제거
    const cleanISBN = isbn.replace(/-/g, '')

    // API URL 구성 (이미지의 API 스펙에 맞춤)
    let url = `${DATA4LIBRARY_API_URL}?`
    
    if (hasValidApiKey()) {
      url += `authKey=${DATA4LIBRARY_API_KEY}&`
    }
    
    url += `isbn=${cleanISBN}`
    
    // 지역코드가 있으면 추가
    if (region) {
      url += `&region=${region}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`)
    }

    // XML 또는 JSON 응답 처리
    const contentType = response.headers.get('content-type')
    let data

    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      // XML 응답인 경우 텍스트로 받아서 파싱
      const xmlText = await response.text()
      data = parseXMLResponse(xmlText)
    }

    // 응답 구조에 따라 도서관 정보 추출
    if (data.error) {
      throw new Error(data.error || 'API 오류가 발생했습니다.')
    }

    // JSON 응답 구조: response.libs.lib
    if (data.response && data.response.libs && data.response.libs.lib) {
      const libraries = Array.isArray(data.response.libs.lib)
        ? data.response.libs.lib
        : [data.response.libs.lib]

      return libraries.map(lib => ({
        libCode: lib.libCode || '',
        libName: lib.libName ? lib.libName.trim() : '',
        address: lib.address ? lib.address.trim() : '',
        tel: lib.tel ? lib.tel.trim() : '',
        fax: lib.fax ? lib.fax.trim() : '',
        homepage: lib.homepage ? lib.homepage.trim() : '',
        closed: lib.closed ? lib.closed.trim() : '',
        operatingTime: lib.operatingTime ? lib.operatingTime.trim() : '',
        latitude: lib.latitude ? parseFloat(lib.latitude.trim()) : null,
        longitude: lib.longitude ? parseFloat(lib.longitude.trim()) : null,
      }))
    }

    // XML 파싱 결과가 직접 배열인 경우
    if (Array.isArray(data)) {
      return data
    }

    return []
  } catch (error) {
    console.error('도서관 검색 오류:', error)
    throw error
  }
}

/**
 * XML 응답을 파싱하는 함수
 * @param {string} xmlText - XML 텍스트
 * @returns {Object} 파싱된 데이터
 */
const parseXMLResponse = (xmlText) => {
  try {
    // 간단한 XML 파싱 (DOMParser 사용)
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

    // 에러 확인
    const errorElement = xmlDoc.querySelector('error')
    if (errorElement) {
      return { error: errorElement.textContent }
    }

    // libs 요소 찾기
    const libs = xmlDoc.querySelectorAll('lib')
    const libraries = []

    libs.forEach(lib => {
      const getTextContent = (selector) => {
        const element = lib.querySelector(selector)
        return element ? element.textContent.trim() : ''
      }

      libraries.push({
        libCode: getTextContent('libCode'),
        libName: getTextContent('libName'),
        address: getTextContent('address'),
        tel: getTextContent('tel'),
        fax: getTextContent('fax'),
        homepage: getTextContent('homepage'),
        closed: getTextContent('closed'),
        operatingTime: getTextContent('operatingTime'),
        latitude: getTextContent('latitude') ? parseFloat(getTextContent('latitude')) : null,
        longitude: getTextContent('longitude') ? parseFloat(getTextContent('longitude')) : null,
      })
    })

    return {
      response: {
        libs: {
          lib: libraries
        }
      }
    }
  } catch (error) {
    console.error('XML 파싱 오류:', error)
    return { error: 'XML 파싱에 실패했습니다.' }
  }
}

/**
 * 주소를 좌표로 변환 (카카오맵 Geocoder 사용)
 * @param {string} address - 주소
 * @returns {Promise<{lat: number, lng: number}>} 좌표
 */
export const geocodeAddress = (address) => {
  return new Promise((resolve, reject) => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      reject(new Error('카카오맵 SDK가 로드되지 않았습니다.'))
      return
    }

    const geocoder = new window.kakao.maps.services.Geocoder()
    
    geocoder.addressSearch(address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        resolve({
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x)
        })
      } else {
        reject(new Error('주소를 좌표로 변환할 수 없습니다.'))
      }
    })
  })
}

