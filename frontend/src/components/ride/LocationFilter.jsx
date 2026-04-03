import { useRef, useEffect } from 'react';
import { LOCATIONS } from '../../utils/constants';

export default function LocationFilter({ value, onChange }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left, behavior: 'smooth' });
    }
  }, [value]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 -mx-4 snap-x snap-mandatory"
    >
      {LOCATIONS.map((loc) => {
        const isActive = value === loc.key;
        return (
          <button
            key={loc.key}
            ref={isActive ? activeRef : null}
            onClick={() => onChange(loc.key)}
            className={`
              snap-start shrink-0 flex items-center gap-1.5 px-4 py-2.5
              rounded-full text-sm font-semibold
              transition-all duration-200 whitespace-nowrap
              ${isActive
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-[1.02] ring-1 ring-white/10'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95'
              }
            `}
          >
            <span className="text-base">{loc.icon}</span>
            {loc.label}
          </button>
        );
      })}
    </div>
  );
}
