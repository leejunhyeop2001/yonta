import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DirectionToggle from '../components/ride/DirectionToggle';
import LocationFilter from '../components/ride/LocationFilter';
import RideList from '../components/ride/RideList';
import { getAvailableParties, getPartyDetail, joinParty, leaveParty } from '../api/rideApi';
import { getNextDays, getDateLabel, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import { usePartyRealtime } from '../hooks/usePartyRealtime';

const CAMPUS_KEY = 'CAMPUS';
const PERIODS = [
  { key: 'DAWN', label: '새벽', icon: '🌙', startHour: 0, endHour: 5 },
  { key: 'MORNING', label: '오전', icon: '🌅', startHour: 6, endHour: 11 },
  { key: 'AFTERNOON', label: '오후', icon: '☀️', startHour: 12, endHour: 17 },
  { key: 'NIGHT', label: '밤', icon: '🌃', startHour: 18, endHour: 23 },
];

function defaultPeriodKey() {
  const h = new Date().getHours();
  if (h < 6) return 'DAWN';
  if (h < 12) return 'MORNING';
  if (h < 18) return 'AFTERNOON';
  return 'NIGHT';
}

function getHHmm(isoDateTime) {
  return isoDateTime?.split('T')[1]?.slice(0, 5) ?? '00:00';
}

function toDateKey(isoDateTime) {
  return isoDateTime?.slice(0, 10);
}

export default function RideListPage() {
  const [direction, setDirection] = useState('TO_CITY');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(() => getNextDays(1)[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriodKey);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const [selectedPartyDetail, setSelectedPartyDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const dates = useMemo(() => getNextDays(7), []);

  const loadParties = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (direction === 'TO_CITY') {
        params.departure = CAMPUS_KEY;
        if (selectedLocation !== 'ALL') params.destination = selectedLocation;
      } else {
        if (selectedLocation !== 'ALL') params.departure = selectedLocation;
        params.destination = CAMPUS_KEY;
      }
      const res = await getAvailableParties(params);
      setParties(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || '파티 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [direction, selectedLocation]);

  const loadPartyDetail = useCallback(async (partyId) => {
    setDetailLoading(true);
    try {
      const res = await getPartyDetail(partyId);
      setSelectedPartyDetail(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || '파티 상세를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedLocation, direction, selectedPeriod]);

  useEffect(() => {
    if (!selectedPartyId) return undefined;
    loadPartyDetail(selectedPartyId);
  }, [selectedPartyId, loadPartyDetail]);

  usePartyRealtime(
    selectedPartyId,
    () => {
      if (selectedPartyId) {
        loadPartyDetail(selectedPartyId);
        loadParties();
      }
    },
    Boolean(selectedPartyId),
  );

  const filteredByBase = useMemo(() => {
    return parties.filter((p) => {
      const matchDir =
        direction === 'TO_CITY'
          ? p.departure === CAMPUS_KEY
          : p.destination === CAMPUS_KEY;

      const targetLoc = direction === 'TO_CITY' ? p.destination : p.departure;
      const matchLoc = selectedLocation === 'ALL' || targetLoc === selectedLocation;
      const matchDate = toDateKey(p.departureTime) === selectedDate;

      return matchDir && matchLoc && matchDate;
    });
  }, [direction, selectedLocation, parties, selectedDate]);

  const periodCounts = useMemo(() => {
    const counts = Object.fromEntries(PERIODS.map((p) => [p.key, 0]));
    filteredByBase.forEach((party) => {
      const hour = Number(getHHmm(party.departureTime).split(':')[0]);
      const period = PERIODS.find((p) => hour >= p.startHour && hour <= p.endHour);
      if (period) counts[period.key] += 1;
    });
    return counts;
  }, [filteredByBase]);

  const slotRows = useMemo(() => {
    const period = PERIODS.find((p) => p.key === selectedPeriod) || PERIODS[1];
    const slots = [];
    for (let h = period.startHour; h <= period.endHour; h += 1) {
      for (let m = 0; m < 60; m += 10) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return slots;
  }, [selectedPeriod]);

  const slotCountMap = useMemo(() => {
    const map = {};
    filteredByBase.forEach((party) => {
      const hhmm = getHHmm(party.departureTime);
      map[hhmm] = (map[hhmm] || 0) + 1;
    });
    return map;
  }, [filteredByBase]);

  const filtered = useMemo(() => {
    if (selectedSlot) {
      return filteredByBase.filter((p) => getHHmm(p.departureTime) === selectedSlot);
    }
    const period = PERIODS.find((p) => p.key === selectedPeriod) || PERIODS[1];
    return filteredByBase.filter((p) => {
      const hour = Number(getHHmm(p.departureTime).split(':')[0]);
      return hour >= period.startHour && hour <= period.endHour;
    });
  }, [filteredByBase, selectedPeriod, selectedSlot]);

  const recruitingCount = filtered.filter((p) => p.status === 'RECRUITING').length;

  const handleJoin = async () => {
    if (!selectedPartyId) return;
    setActionLoading(true);
    try {
      await joinParty(selectedPartyId);
      toast.success('파티에 참여했습니다.');
      await Promise.all([loadParties(), loadPartyDetail(selectedPartyId)]);
    } catch (err) {
      toast.error(err.response?.data?.message || '참여에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!selectedPartyId) return;
    setActionLoading(true);
    try {
      await leaveParty(selectedPartyId);
      toast.success('파티에서 나왔습니다.');
      await Promise.all([loadParties(), loadPartyDetail(selectedPartyId)]);
    } catch (err) {
      toast.error(err.response?.data?.message || '나가기에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/90 via-white to-sky-50/30">
      {/* Sticky Filter Section */}
      <div className="sticky top-[118px] z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm shadow-slate-900/[0.03]">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-3 space-y-3">
          {/* Direction Toggle */}
          <DirectionToggle value={direction} onChange={setDirection} />

          {/* Date Selector */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 py-1">
            {dates.map((d) => {
              const active = d === selectedDate;
              const label = getDateLabel(d);
              const sub = formatDate(d);
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`
                    shrink-0 flex flex-col items-center px-4 py-2 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${active
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 ring-1 ring-white/10'
                      : 'bg-slate-100/90 text-slate-500 hover:bg-slate-200/90'
                    }
                  `}
                >
                  <span className="text-sm font-bold">{label}</span>
                  <span className={active ? 'text-sky-200/90' : 'text-slate-400'}>{sub}</span>
                </button>
              );
            })}
          </div>

          {/* Location Filter */}
          <LocationFilter
            value={selectedLocation}
            onChange={setSelectedLocation}
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="max-w-3xl mx-auto px-4 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{filtered.length}</span>개 파티
            <span className="ml-1 text-gray-400">
              ({selectedSlot || PERIODS.find((p) => p.key === selectedPeriod)?.label})
            </span>
            {recruitingCount > 0 && (
              <span className="ml-1.5 text-green-600 font-semibold">
                · {recruitingCount}개 모집중
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V9" />
              </svg>
              시간순
            </button>
          </div>
        </div>
      </div>

      {/* Time Period + 10min Slots */}
      <div className="max-w-3xl mx-auto px-4 pb-3">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {PERIODS.map((period) => {
            const active = selectedPeriod === period.key;
            return (
              <button
                key={period.key}
                onClick={() => {
                  setSelectedPeriod(period.key);
                  setSelectedSlot(null);
                }}
                className={`rounded-xl border px-2 py-2 text-center transition ${
                  active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                <p className="text-lg leading-none">{period.icon}</p>
                <p className="text-xs font-bold mt-1">{period.label}</p>
                <p className="text-[11px] mt-0.5">{periodCounts[period.key] || 0}개</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-white/95 border border-slate-200/80 p-3 shadow-sm shadow-slate-900/[0.04]">
          <div className="flex flex-wrap gap-2">
            {slotRows.map((slot) => {
              const count = slotCountMap[slot] || 0;
              const active = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot((prev) => (prev === slot ? null : slot))}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition ${
                    active
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : count > 0
                        ? 'border-sky-200 bg-sky-50 text-blue-800 hover:border-sky-300'
                        : 'border-slate-200 bg-slate-50/80 text-slate-400'
                  }`}
                >
                  {slot} · {count}개
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">원하는 10분 단위를 누르면 해당 시간 파티만 보여줍니다.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-1">
        <div className="relative py-2">
          <div className="border-t border-gray-200" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 bg-gray-50 px-3 text-[11px] text-gray-400 font-semibold">
            합승 파티 목록
          </span>
        </div>
      </div>

      {/* Ride List */}
      <main className="max-w-3xl mx-auto px-4 pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <RideList
            parties={filtered}
            onCardClick={(p) => setSelectedPartyId(p.id)}
          />
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Link
          to="/create"
          className="
          flex items-center gap-2 bg-gradient-to-r from-blue-800 to-sky-600
          text-white px-6 py-4 rounded-2xl font-bold text-sm
          shadow-xl shadow-blue-900/25 ring-1 ring-white/20
          hover:shadow-2xl hover:brightness-105 hover:-translate-y-0.5
          active:translate-y-0 active:shadow-lg
          transition-all duration-200
        "
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          파티 만들기
        </Link>
      </div>

      {selectedPartyId && (
        <PartyDetailSheet
          party={selectedPartyDetail}
          loading={detailLoading}
          actionLoading={actionLoading}
          onClose={() => {
            setSelectedPartyId(null);
            setSelectedPartyDetail(null);
          }}
          onJoin={handleJoin}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}

function PartyDetailSheet({ party, loading, actionLoading, onClose, onJoin, onLeave }) {
  const isMine = party?.mine;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[2px] flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-white rounded-t-3xl p-5 pb-7 shadow-2xl shadow-black/20 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">파티 상세</h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>닫기</button>
        </div>

        {loading || !party ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100/80 p-4">
              <p className="text-sm text-blue-800 font-semibold mb-1">현재 익명 인원</p>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {party.currentCount}/{party.maxCount}명
              </p>
              <p className="text-xs text-blue-600/80 mt-1 font-medium">참여·탈퇴 시 실시간 반영됩니다.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {party.anonymousParticipants?.map((alias) => (
                <div key={alias} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                  👤 {alias}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              {isMine ? (
                <button
                  onClick={onLeave}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 font-semibold border border-red-200 hover:bg-red-100 disabled:opacity-60"
                >
                  내 파티 나가기
                </button>
              ) : (
                <button
                  onClick={onJoin}
                  disabled={actionLoading || party.status !== 'RECRUITING'}
                  className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60"
                >
                  {party.status === 'RECRUITING' ? '참여하기' : '참여 불가'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
