import { useState, useEffect, useMemo, useCallback } from 'react';
import { getTimeSlots } from '../../api/timeSlotApi';

const PERIODS = [
  { name: '새벽', icon: '🌙', startH: 0, endH: 5 },
  { name: '오전', icon: '🌅', startH: 6, endH: 11 },
  { name: '오후', icon: '☀️', startH: 12, endH: 17 },
  { name: '저녁/밤', icon: '🌆', startH: 18, endH: 23 },
];

const PERIOD_COLORS = {
  '새벽': { bg: 'from-indigo-950 to-slate-900', accent: 'bg-indigo-500', ring: 'ring-indigo-400' },
  '오전': { bg: 'from-amber-50 to-orange-50', accent: 'bg-amber-500', ring: 'ring-amber-400' },
  '오후': { bg: 'from-sky-50 to-blue-50', accent: 'bg-sky-500', ring: 'ring-sky-400' },
  '저녁/밤': { bg: 'from-purple-950 to-slate-900', accent: 'bg-purple-500', ring: 'ring-purple-400' },
};

const isDark = (p) => p === '새벽' || p === '저녁/밤';

function generateLocalSlots(selectedDate) {
  const now = new Date();
  const target = new Date(selectedDate + 'T00:00:00');
  const isToday = now.toDateString() === target.toDateString();

  const grouped = {};
  PERIODS.forEach(({ name, startH, endH }) => {
    const slots = [];
    for (let h = startH; h <= endH; h++) {
      for (let m = 0; m < 60; m += 10) {
        const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const slotTime = new Date(target);
        slotTime.setHours(h, m, 0, 0);
        slots.push({
          index: h * 6 + m / 10,
          label,
          available: !isToday || slotTime > now,
          currentCount: 0,
          maxCount: 4,
        });
      }
    }
    grouped[name] = slots;
  });
  return grouped;
}

export default function TimeSlotPicker({ selectedDate, value, onChange }) {
  const [slots, setSlots] = useState({});
  const [activePeriod, setActivePeriod] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const { data } = await getTimeSlots(selectedDate);
      if (data?.data && Object.keys(data.data).length > 0) {
        setSlots(data.data);
      } else {
        setSlots(generateLocalSlots(selectedDate));
      }
    } catch {
      setSlots(generateLocalSlots(selectedDate));
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    if (activePeriod || Object.keys(slots).length === 0) return;
    const hour = new Date().getHours();
    if (hour < 6) setActivePeriod('새벽');
    else if (hour < 12) setActivePeriod('오전');
    else if (hour < 18) setActivePeriod('오후');
    else setActivePeriod('저녁/밤');
  }, [slots, activePeriod]);

  const currentSlots = activePeriod ? (slots[activePeriod] || []) : [];
  const colors = PERIOD_COLORS[activePeriod] || PERIOD_COLORS['오후'];
  const dark = activePeriod ? isDark(activePeriod) : false;

  const hourGroups = useMemo(() => {
    const groups = {};
    currentSlots.forEach((s) => {
      const hour = s.label.split(':')[0];
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(s);
    });
    return Object.entries(groups);
  }, [currentSlots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Period Tabs */}
      <div className="flex rounded-2xl bg-gray-100 p-1 mb-6 gap-1">
        {PERIODS.map(({ name, icon }) => (
          <button
            key={name}
            onClick={() => setActivePeriod(name)}
            className={`
              flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-300
              ${activePeriod === name
                ? 'bg-white text-gray-900 shadow-md scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <span className="block text-lg mb-0.5">{icon}</span>
            {name}
          </button>
        ))}
      </div>

      {/* Screen Effect */}
      <div className={`rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-b ${colors.bg}`}>
        <div className="relative px-8 pt-6 pb-4">
          <div className={`h-1.5 rounded-full mx-auto max-w-xs ${dark ? 'bg-white/20' : 'bg-gray-300/60'}`} />
          <p className={`text-center text-xs mt-2 font-medium tracking-widest uppercase ${dark ? 'text-white/40' : 'text-gray-400'}`}>
            출발 시간 선택
          </p>
        </div>

        {/* Time Slot Grid */}
        <div className="px-4 pb-6 space-y-3">
          {hourGroups.map(([hour, hourSlots]) => (
            <div key={hour} className="flex items-center gap-2">
              <div className={`w-14 text-right text-sm font-bold shrink-0 tabular-nums ${dark ? 'text-white/60' : 'text-gray-400'}`}>
                {hour}시
              </div>
              <div className="flex gap-1.5 flex-1">
                {hourSlots.map((slot) => {
                  const isSelected = value === slot.label;
                  const isDisabled = !slot.available;
                  const cur = slot.currentCount ?? 0;
                  const max = slot.maxCount ?? 4;
                  const isFull = cur >= max;
                  return (
                    <button
                      key={slot.index}
                      disabled={isDisabled || isFull}
                      onClick={() => onChange(slot.label)}
                      className={`
                        relative flex-1 py-2 rounded-xl text-center
                        transition-all duration-200 tabular-nums
                        ${isDisabled || isFull
                          ? dark
                            ? 'bg-white/5 text-white/15 cursor-not-allowed'
                            : 'bg-gray-200/50 text-gray-300 cursor-not-allowed'
                          : isSelected
                            ? `${colors.accent} text-white shadow-lg scale-105 ring-2 ${colors.ring} ring-offset-2 ${dark ? 'ring-offset-slate-900' : 'ring-offset-white'}`
                            : dark
                              ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:scale-105 active:scale-95'
                              : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-md hover:scale-105 active:scale-95'
                        }
                      `}
                    >
                      <span className="block text-xs font-bold leading-tight">
                        {slot.label.split(':')[1]}
                      </span>
                      <span className={`block text-[10px] font-semibold leading-tight mt-0.5 ${
                        isSelected
                          ? 'text-white/70'
                          : isDisabled || isFull
                            ? dark ? 'text-white/10' : 'text-gray-300'
                            : cur > 0
                              ? dark ? 'text-amber-300/80' : 'text-amber-500'
                              : dark ? 'text-white/40' : 'text-gray-400'
                      }`}>
                        {cur}/{max}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.accent} opacity-75`} />
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${colors.accent}`} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className={`flex justify-center gap-6 px-6 pb-5 text-xs ${dark ? 'text-white/40' : 'text-gray-400'}`}>
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${dark ? 'bg-white/10' : 'bg-white/80'} border ${dark ? 'border-white/20' : 'border-gray-200'}`} />
            선택 가능
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${colors.accent}`} />
            선택됨
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${dark ? 'bg-white/5' : 'bg-gray-200/50'}`} />
            지난 시간
          </span>
        </div>
      </div>

      {/* Selected Time Display */}
      {value && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-5 py-2.5 rounded-full font-semibold text-sm border border-blue-100">
            🚕 출발 시간: <span className="text-lg font-bold">{value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
