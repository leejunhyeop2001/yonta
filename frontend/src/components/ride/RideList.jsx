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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🚕</span>
        </div>
        <p className="text-gray-900 font-bold text-lg mb-1">아직 합승 파티가 없어요</p>
        <p className="text-gray-400 text-sm">첫 번째 파티를 만들어보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([time, slots]) => (
        <div key={time}>
          {/* Time Slot Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 bg-blue-800 text-white px-3.5 py-1.5 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-extrabold tabular-nums">{time}</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">{slots.length}개 파티</span>
            <div className="flex-1 border-t border-dashed border-gray-200" />
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
