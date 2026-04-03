import RideCard from './RideCard';

function groupByTimeSlot(parties) {
  const groups = {};
  parties.forEach((p) => {
    const time = p.departureTime.split('T')[1]?.slice(0, 5) ?? '??:??';
    if (!groups[time]) groups[time] = [];
    groups[time].push(p);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export default function RideList({ parties, onCardClick }) {
  const grouped = groupByTimeSlot(parties);

  if (parties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-200/50 to-blue-200/40 blur-xl scale-110" aria-hidden />
          <div className="relative w-24 h-24 rounded-3xl bg-white border border-slate-200/80 shadow-lg shadow-slate-900/[0.06] flex items-center justify-center">
            <span className="text-4xl">🚕</span>
          </div>
        </div>
        <p className="text-slate-900 font-extrabold text-lg mb-1 tracking-tight">아직 합승 파티가 없어요</p>
        <p className="text-slate-500 text-sm font-medium">첫 번째 파티를 만들어보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([time, slots]) => (
        <div key={time}>
          {/* Time Slot Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-blue-900 text-white px-3.5 py-1.5 rounded-full shadow-md shadow-slate-900/15">
              <svg className="w-3.5 h-3.5 opacity-90" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-extrabold tabular-nums">{time}</span>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{slots.length}개 파티</span>
            <div className="flex-1 border-t border-dashed border-slate-200" />
          </div>

          {/* Cards */}
          <div className="space-y-3 pl-2">
            {slots.map((party) => (
              <RideCard
                key={party.id}
                party={party}
                onClick={onCardClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
