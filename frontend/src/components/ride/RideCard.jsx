import { LOCATIONS, GENDER_OPTIONS, RIDE_OPTIONS, PARTY_STATUS } from '../../utils/constants';

const TEMP_COLOR = (t) => {
  if (t >= 40) return 'text-red-500';
  if (t >= 37.5) return 'text-orange-500';
  return 'text-blue-500';
};

const locationLabel = (key) =>
  LOCATIONS.find((l) => l.key === key)?.label ?? key;

const locationIcon = (key) =>
  LOCATIONS.find((l) => l.key === key)?.icon ?? '📍';

export default function RideCard({ party, onClick }) {
  const {
    departure, destination, departureTime,
    currentCount, maxCount, genderOption,
    rideOptions = [], status, host = { mannerTemp: 36.5 }, participants = [], anonymousParticipants = [],
  } = party;

  const time = departureTime.split('T')[1]?.slice(0, 5);
  const isFull = status === 'FULL';
  const gOpt = GENDER_OPTIONS[genderOption] || GENDER_OPTIONS.ANY;
  const statusInfo = PARTY_STATUS[status] || PARTY_STATUS.RECRUITING;
  const fillPercent = (currentCount / maxCount) * 100;

  return (
    <button
      type="button"
      onClick={() => onClick?.(party)}
      className={`
        group w-full text-left rounded-2xl border p-4
        transition-all duration-200
        ${isFull
          ? 'border-slate-100 bg-slate-50/60 opacity-65'
          : 'border-slate-200/90 bg-white/95 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/5 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md ring-1 ring-transparent hover:ring-sky-100/80'
        }
      `}
    >
      {/* Top Row: Route + Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
          <span>{locationIcon(departure)}</span>
          <span>{locationLabel(departure)}</span>
          <svg className="w-3.5 h-3.5 text-gray-300 mx-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          <span>{locationIcon(destination)}</span>
          <span>{locationLabel(destination)}</span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Middle Row: Time + Options */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl font-extrabold text-gray-900 tabular-nums tracking-tight">
          {time}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          {/* Gender Badge */}
          <span className={`
            inline-flex items-center gap-1 text-xs font-semibold
            px-2 py-1 rounded-lg bg-gray-100 ${gOpt.color}
          `}>
            <span>{gOpt.icon}</span>
            {gOpt.label}
          </span>
          {/* Ride Option Badges */}
          {rideOptions.map((opt) => {
            const info = RIDE_OPTIONS[opt];
            if (!info) return null;
            return (
              <span
                key={opt}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600"
              >
                <span>{info.icon}</span>
                {info.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Participants */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Participant Avatars */}
          <div className="flex -space-x-2">
            {Array.from({ length: maxCount }).map((_, i) => {
              const filled = i < currentCount;
              const p = participants[i];
              const alias = anonymousParticipants[i];
              return (
                <div
                  key={i}
                  className={`
                    w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold
                    transition-all duration-300
                    ${filled
                      ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-300 border-dashed border-gray-200'
                    }
                  `}
                  title={p?.name || alias}
                >
                  {filled ? (p?.name?.[0] ?? alias?.slice(-1) ?? '?') : '+'}
                </div>
              );
            })}
          </div>

          {/* Count Text */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold text-gray-900">
              {currentCount}<span className="text-gray-300 font-medium">/{maxCount}명</span>
            </span>
            {/* Mini progress bar */}
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-gray-400' : fillPercent >= 75 ? 'bg-orange-400' : 'bg-blue-500'
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Host Manner Temp */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-gray-400">🌡️</span>
          <span className={`font-bold ${TEMP_COLOR(host.mannerTemp)}`}>
            {host.mannerTemp.toFixed(1)}°
          </span>
        </div>
      </div>
    </button>
  );
}
