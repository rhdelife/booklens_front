import { useFocusSound } from '../contexts/FocusSoundContext'

const soundLabels = {
  plane: '✈️ Plane',
  fire: '🔥 Fireplace',
  water: '💧 Water',
}

export default function FocusSoundFAB() {
  const {
    isOpen,
    setIsOpen,
    isActive,
    togglePlay,
    soundType,
    changeSound,
    volume,
    changeVolume,
  } = useFocusSound()

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 확장 패널 */}
      {isOpen && (
        <div className="mb-3 p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200/50 space-y-3 transition-all duration-200 animate-fade-in">
          {/* 사운드 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Sound
            </label>
            <div className="flex gap-2">
              {Object.keys(soundLabels).map((key) => (
                <button
                  key={key}
                  onClick={() => changeSound(key)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                    soundType === key
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {soundLabels[key]}
                </button>
              ))}
            </div>
          </div>

          {/* 볼륨 조절 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Volume: {Math.round(volume * 100)}%
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeVolume(-0.1)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
                aria-label="Decrease volume"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all duration-200"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              <button
                onClick={() => changeVolume(0.1)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
                aria-label="Increase volume"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Play/Pause 버튼 */}
          <button
            onClick={togglePlay}
            className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              isActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            }`}
          >
            {isActive ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>
      )}

      {/* FAB 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-gray-900 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isActive ? 'ring-2 ring-gray-400 ring-offset-2' : ''
        }`}
        aria-label="Focus sound controls"
      >
        <div className="flex items-center justify-center">
          {isActive ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343l11.314 11.314" />
            </svg>
          )}
        </div>
      </button>
    </div>
  )
}

