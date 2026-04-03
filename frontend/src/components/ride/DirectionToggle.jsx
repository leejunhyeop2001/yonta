export default function DirectionToggle({ value, onChange }) {
  return (
    <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
      <button
        onClick={() => onChange('TO_CITY')}
        className={`
          flex-1 flex items-center justify-center gap-2 py-3 px-4
          rounded-xl text-sm font-bold transition-all duration-300
          ${value === 'TO_CITY'
            ? 'bg-white text-gray-900 shadow-md'
            : 'text-gray-400 hover:text-gray-600'
          }
        `}
      >
        <span className="text-base">🏫</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <span className="text-base">🏙️</span>
        <span className="ml-1">시내로</span>
      </button>
      <button
        onClick={() => onChange('TO_CAMPUS')}
        className={`
          flex-1 flex items-center justify-center gap-2 py-3 px-4
          rounded-xl text-sm font-bold transition-all duration-300
          ${value === 'TO_CAMPUS'
            ? 'bg-white text-gray-900 shadow-md'
            : 'text-gray-400 hover:text-gray-600'
          }
        `}
      >
        <span className="text-base">🏙️</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <span className="text-base">🏫</span>
        <span className="ml-1">학교로</span>
      </button>
    </div>
  );
}
