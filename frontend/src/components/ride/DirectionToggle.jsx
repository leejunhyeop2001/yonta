export default function DirectionToggle({ value, onChange }) {
  return (
    <div className="flex bg-slate-100/90 rounded-2xl p-1 gap-1 ring-1 ring-slate-200/60">
      <button
        type="button"
        onClick={() => onChange('TO_CITY')}
        className={`
          flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4
          rounded-xl text-sm font-bold transition-all duration-300
          ${value === 'TO_CITY'
            ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-200/80'
            : 'text-slate-500 hover:text-slate-700'
          }
        `}
      >
        <span className="text-base">🏫</span>
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <span className="text-base">🏙️</span>
        <span className="ml-0.5 hidden sm:inline">시내로</span>
        <span className="ml-0.5 sm:hidden">시내</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('TO_CAMPUS')}
        className={`
          flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4
          rounded-xl text-sm font-bold transition-all duration-300
          ${value === 'TO_CAMPUS'
            ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-200/80'
            : 'text-slate-500 hover:text-slate-700'
          }
        `}
      >
        <span className="text-base">🏙️</span>
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <span className="text-base">🏫</span>
        <span className="ml-0.5 hidden sm:inline">학교로</span>
        <span className="ml-0.5 sm:hidden">학교</span>
      </button>
    </div>
  );
}
