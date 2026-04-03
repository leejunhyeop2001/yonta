import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RideList from '../components/ride/RideList';
import {
  getMyParties, getMyPartyHistory, getPartyDetail, leaveParty, submitPartyReview,
} from '../api/rideApi';
import { LOCATIONS } from '../utils/constants';

export default function MyPartyPage() {
  const navigate = useNavigate();
  const [activeParties, setActiveParties] = useState([]);
  const [historyParties, setHistoryParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const loadMyPage = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([getMyParties(), getMyPartyHistory()]);
      setActiveParties(activeRes.data.data || []);
      setHistoryParties(historyRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || '마이페이지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('내 파티는 로그인 후 확인할 수 있습니다.');
      navigate('/auth', { replace: true });
      return;
    }
    loadMyPage();
  }, [loadMyPage, navigate]);

  const openParty = async (id) => {
    try {
      const res = await getPartyDetail(id);
      setSelected(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || '상세 정보를 불러오지 못했습니다.');
    }
  };

  const handleLeave = async () => {
    if (!selected?.id) return;
    setActionLoading(true);
    try {
      await leaveParty(selected.id);
      toast.success('파티에서 나왔습니다.');
      setSelected(null);
      await loadMyPage();
    } catch (err) {
      toast.error(err.response?.data?.message || '나가기에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (historyItem) => {
    setReviewTarget(historyItem);
    setReviewScore(5);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget?.party?.id) return;
    setActionLoading(true);
    try {
      await submitPartyReview(reviewTarget.party.id, {
        rating: reviewScore,
        comment: reviewComment.trim(),
      });
      toast.success('평가를 저장했습니다.');
      setReviewTarget(null);
      await loadMyPage();
    } catch (err) {
      toast.error(err.response?.data?.message || '평가 저장에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/90 via-white to-sky-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">마이페이지</h2>
          <p className="text-sm text-slate-500 font-medium">진행중 파티와 지난 파티 기록, 평가를 관리하세요.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-2xl bg-slate-100/90 ring-1 ring-slate-200/60">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`rounded-xl py-3 text-sm font-bold transition-all ${
              tab === 'active'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            진행중 {activeParties.length}
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`rounded-xl py-3 text-sm font-bold transition-all ${
              tab === 'history'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            지난 기록 {historyParties.length}
          </button>
        </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">불러오는 중...</div>
      ) : tab === 'active' ? (
        <RideList parties={activeParties} onCardClick={(p) => openParty(p.id)} />
      ) : (
        <div className="space-y-3">
          {historyParties.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center text-gray-400">
              지난 파티 기록이 아직 없습니다.
            </div>
          ) : historyParties.map((item) => (
            <HistoryCard key={item.party.id} item={item} onReview={() => openReviewModal(item)} />
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-3xl bg-white rounded-t-3xl p-5 pb-7 border-t border-slate-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-bold text-gray-900 mb-2">내 파티 상세</p>
            <p className="text-sm text-gray-500 mb-3">
              익명 인원: {selected.currentCount}/{selected.maxCount}명
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {selected.anonymousParticipants?.map((alias) => (
                <div key={alias} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                  👤 {alias}
                </div>
              ))}
            </div>
            <button
              onClick={handleLeave}
              disabled={actionLoading}
              className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold border border-red-200 hover:bg-red-100 disabled:opacity-60"
            >
              파티 나가기
            </button>
          </div>
        </div>
      )}

      {reviewTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[70] flex items-end justify-center" onClick={() => setReviewTarget(null)}>
          <div className="w-full max-w-2xl bg-white rounded-t-3xl p-5 pb-7 border-t border-slate-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">지난 파티 평가</h3>
            <p className="text-sm text-gray-500 mb-4">
              {reviewTarget.party.departureTime.slice(0, 16).replace('T', ' ')}
            </p>

            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setReviewScore(n)}
                  className={`text-2xl ${n <= reviewScore ? 'text-yellow-400' : 'text-gray-200'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              maxLength={300}
              placeholder="탑승 경험을 남겨주세요. (선택)"
              className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{reviewComment.length}/300</p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setReviewTarget(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-semibold disabled:opacity-60"
              >
                평가 저장
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function HistoryCard({ item, onReview }) {
  const party = item.party;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-900/[0.04]">
      <p className="text-xs text-gray-400 mb-1">{party.departureTime.slice(0, 16).replace('T', ' ')}</p>
      <p className="text-sm font-bold text-gray-900 mb-1">
        {labelOf(party.departure)} {'->'} {labelOf(party.destination)}
      </p>
      <p className="text-xs text-gray-500 mb-3">인원 {party.currentCount}/{party.maxCount}명</p>

      {item.reviewed ? (
        <div className="rounded-xl bg-green-50 border border-green-100 px-3 py-2 text-sm text-green-700">
          평가 완료 · {item.myRating}점
          {item.myComment ? ` · ${item.myComment}` : ''}
        </div>
      ) : (
        <button
          onClick={onReview}
          className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100"
        >
          평가 남기기
        </button>
      )}
    </div>
  );
}

function labelOf(key) {
  return LOCATIONS.find((l) => l.key === key)?.label || key;
}
