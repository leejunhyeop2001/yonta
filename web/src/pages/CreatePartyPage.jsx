import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createParty } from '../api/rideApi';
import { GENDER_OPTIONS } from '../utils/constants';
import { getNextDays, getDateLabel, formatDate } from '../utils/formatters';
import { getCampusPlace, legacyKeyForPlace, loadFixedPlaces } from '../lib/places';

const initialForm = {
  departure: '',
  destination: '',
  departureTime: '',
  maxCount: 4,
  genderOption: 'ANY',
  rideOptions: [],
};

const PERIODS = [
  { key: 'DAWN', label: '새벽', icon: '🌙', startHour: 0, endHour: 5 },
  { key: 'MORNING', label: '오전', icon: '🌅', startHour: 6, endHour: 11 },
  { key: 'AFTERNOON', label: '오후', icon: '☀️', startHour: 12, endHour: 17 },
  { key: 'NIGHT', label: '밤', icon: '🌃', startHour: 18, endHour: 23 },
];

export default function CreatePartyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [timeConfirmed, setTimeConfirmed] = useState(false);
  const [confirmedTimeLabel, setConfirmedTimeLabel] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => getNextDays(1)[0]);
  const [calendarPeriod, setCalendarPeriod] = useState(defaultPeriodKey());
  const [calendarTime, setCalendarTime] = useState('');

  const [pickupOptions, setPickupOptions] = useState([]);
  const [destOptions, setDestOptions] = useState([]);
  const dateOptions = useMemo(() => getNextDays(7), []);

  useEffect(() => {
    loadFixedPlaces().then((places) => {
      const campus = getCampusPlace(places);
      const pickup = places
        .filter((p) => !p.destOnly)
        .map((p) => ({ key: p.id, label: p.label, icon: '📍' }));
      const dest = places
        .filter((p) => !p.pickupOnly)
        .map((p) => ({ key: p.id, label: p.label, icon: '📍' }));
      setPickupOptions(pickup);
      setDestOptions(dest);
      const defaultDest =
        places.find((p) => legacyKeyForPlace(p) === 'WONJU_STATION') ?? dest[0];
      setForm((prev) => ({
        ...prev,
        departure: campus?.id ?? pickup[0]?.key ?? '',
        destination: defaultDest?.id ?? dest[0]?.key ?? '',
      }));
    }).catch(() => toast.error('장소 목록을 불러오지 못했습니다.'));
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'departureTime') {
      setTimeConfirmed(false);
      setConfirmedTimeLabel('');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('파티 생성은 로그인 후 가능합니다.');
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.departureTime) {
      toast.error('출발 시간을 선택해주세요.');
      return;
    }
    if (!timeConfirmed) {
      toast.error('출발 시간 확인 버튼을 눌러주세요.');
      return;
    }
    if (form.departure === form.destination) {
      toast.error('출발지와 목적지는 달라야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const isoStart = new Date(`${form.departureTime}:00`).toISOString();
      await createParty({
        ...form,
        departureTime: isoStart,
      });
      toast.success('파티를 만들었습니다.');
      navigate('/my');
    } catch (err) {
      toast.error(err.response?.data?.message || '파티 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/90 via-white to-sky-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">파티 만들기</h2>
          <p className="text-sm text-slate-500 font-medium">출발 정보 설정 후 모집을 시작하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-xl shadow-slate-900/[0.05]">
        <div className="grid sm:grid-cols-2 gap-3">
          <SelectField
            label="출발지"
            value={form.departure}
            onChange={(v) => updateField('departure', v)}
            options={pickupOptions}
          />
          <SelectField
            label="목적지"
            value={form.destination}
            onChange={(v) => updateField('destination', v)}
            options={destOptions}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">출발 시간</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                disabled={timeConfirmed}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-left text-sm ${
                  timeConfirmed
                    ? 'border-green-200 bg-green-50 text-green-700 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                {form.departureTime ? formatConfirmedTime(form.departureTime) : '출발 시간을 선택하세요'}
              </button>
              {timeConfirmed && (
                <button
                  type="button"
                  onClick={() => {
                    setTimeConfirmed(false);
                    setConfirmedTimeLabel('');
                    setForm((prev) => ({ ...prev, departureTime: '' }));
                    setCalendarTime('');
                    toast('시간 잠금이 해제되었습니다.', { icon: '🕒' });
                  }}
                  className="shrink-0 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100"
                >
                  시간 다시 선택
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">캘린더에서 10분 단위 슬롯 선택 후 확인하세요.</p>
            {timeConfirmed && (
              <p className="mt-1.5 text-xs font-semibold text-green-600">
                확정된 출발 시간: {confirmedTimeLabel}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">최대 인원</label>
            <select
              value={form.maxCount}
              onChange={(e) => updateField('maxCount', Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}명</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">성별 옵션</label>
          <div className="grid sm:grid-cols-3 gap-2">
            {Object.entries(GENDER_OPTIONS).map(([key, opt]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateField('genderOption', key)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  form.genderOption === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 text-white font-bold shadow-md shadow-blue-900/15 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 transition-all"
        >
          {loading ? '생성 중...' : '파티 생성'}
        </button>
      </form>

      {calendarOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-3" onClick={() => setCalendarOpen(false)}>
          <div className="w-full max-w-2xl bg-white rounded-3xl p-5 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">출발 시간 캘린더</h3>
              <button className="text-sm text-gray-400 hover:text-gray-600" onClick={() => setCalendarOpen(false)}>닫기</button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {dateOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => setCalendarDate(d)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs border ${
                    calendarDate === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  <p className="font-bold">{getDateLabel(d)}</p>
                  <p className={calendarDate === d ? 'text-blue-100' : 'text-gray-400'}>{formatDate(d)}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setCalendarPeriod(p.key)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                    calendarPeriod === p.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <span className="block text-base leading-none">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex flex-wrap gap-2">
                {buildSlotsForPeriod(calendarPeriod).map((slot) => {
                  const disabled = isPastSlot(calendarDate, slot);
                  const selected = calendarTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={disabled}
                      onClick={() => setCalendarTime(slot)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border ${
                        disabled
                          ? 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                          : selected
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!calendarTime}
                onClick={() => {
                  const localValue = `${calendarDate}T${calendarTime}`;
                  updateField('departureTime', localValue);
                  setTimeConfirmed(true);
                  setConfirmedTimeLabel(formatConfirmedTime(localValue));
                  setCalendarOpen(false);
                  toast.success('캘린더에서 출발 시간이 확정되었습니다.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-700 text-white font-semibold disabled:opacity-60"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function normalizeToTenMinute(value) {
  return `${value}:00`;
}

function formatConfirmedTime(value) {
  const [date, time] = value.split('T');
  return `${date} ${time.slice(0, 5)}`;
}

function defaultPeriodKey() {
  const h = new Date().getHours();
  if (h < 6) return 'DAWN';
  if (h < 12) return 'MORNING';
  if (h < 18) return 'AFTERNOON';
  return 'NIGHT';
}

function buildSlotsForPeriod(periodKey) {
  const period = PERIODS.find((p) => p.key === periodKey) || PERIODS[1];
  const slots = [];
  for (let h = period.startHour; h <= period.endHour; h += 1) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

function isPastSlot(dateKey, hhmm) {
  const now = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  const slot = new Date(`${dateKey}T00:00:00`);
  slot.setHours(h, m, 0, 0);
  return slot <= now;
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.icon} {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
