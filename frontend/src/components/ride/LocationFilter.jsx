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
                ? 'bg-blue-800 text-white shadow-lg shadow-blue-800/25 scale-105'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95'
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
