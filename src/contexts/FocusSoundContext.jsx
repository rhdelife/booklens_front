import { createContext, useContext, useState, useRef, useEffect } from 'react'

const FocusSoundContext = createContext(null)

export const useFocusSound = () => {
  const context = useContext(FocusSoundContext)
  if (!context) {
    throw new Error('useFocusSound must be used within FocusSoundProvider')
  }
  return context
}

const sounds = {
  plane: '/sounds/airplane.mp3',
  fire: '/sounds/Fire.mp3',
  water: '/sounds/water.mp3',
}

export const FocusSoundProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [soundType, setSoundType] = useState('plane')
  const [volume, setVolume] = useState(0.5)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const audioRef = useRef(null)
  const readingSessionRef = useRef(null)

  // 오디오 초기화
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(sounds[soundType])
      audioRef.current.loop = true
      audioRef.current.volume = volume


      // 오디오 로드 에러 처리
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio load error:', e)
        setIsActive(false)
      })
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener('error', () => { })
        audioRef.current = null
      }
    }
  }, [])

  // 사운드 타입 변경
  useEffect(() => {
    if (audioRef.current && hasUserInteracted) {
      const wasPlaying = !audioRef.current.paused
      audioRef.current.pause()
      audioRef.current.src = sounds[soundType]
      audioRef.current.load()
      if (wasPlaying) {
        audioRef.current.play().catch((error) => {
          console.error('Failed to play audio:', error)
          setIsActive(false)
        })
      }
    }
  }, [soundType, hasUserInteracted])

  // 볼륨 변경
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // 독서 세션 시작/종료 감지
  useEffect(() => {
    const checkReadingSession = () => {
      try {
        const savedSession = localStorage.getItem('readingSession')
        const currentSession = savedSession ? JSON.parse(savedSession) : null

        // 세션이 종료되었으면 오디오 중지
        if (readingSessionRef.current && !currentSession) {
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause()
            setIsActive(false)
          }
        }

        readingSessionRef.current = currentSession
      } catch (error) {
        console.error('Failed to check reading session:', error)
      }
    }

    // 초기 체크
    checkReadingSession()

    // 주기적으로 체크 (1초마다)
    const interval = setInterval(checkReadingSession, 1000)

    // storage 이벤트 리스너
    const handleStorageChange = (e) => {
      if (e.key === 'readingSession') {
        checkReadingSession()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const togglePlay = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true)
    }

    if (!audioRef.current) return

    if (isActive) {
      audioRef.current.pause()
      setIsActive(false)
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Failed to play audio:', error)
        setIsActive(false)
      })
      setIsActive(true)
    }
  }

  const changeSound = (type) => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true)
    }
    setSoundType(type)
  }

  const changeVolume = (delta) => {
    const newVolume = Math.min(1, Math.max(0, volume + delta))
    setVolume(newVolume)
  }

  const value = {
    isOpen,
    setIsOpen,
    isActive,
    togglePlay,
    soundType,
    changeSound,
    volume,
    changeVolume,
    hasUserInteracted,
  }

  return (
    <FocusSoundContext.Provider value={value}>
      {children}
    </FocusSoundContext.Provider>
  )
}

