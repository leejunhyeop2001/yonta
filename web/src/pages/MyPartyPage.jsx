import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RideList from '../components/ride/RideList';
import TrustDashboard from '../components/trust/TrustDashboard';
import {
  getMyParties, getMyPartyHistory, getPartyDetail, leaveParty, dissolveParty, transferHost, submitPartyReview,
} from '../api/rideApi';
import { getTrustDashboard, submitMemberReview, submitNoShowReport } from '../api/trustApi';
import { LOCATIONS } from '../utils/constants';
import { formatDateTimeKST } from '../utils/formatters';
import PartyChatPanel from '../components/chat/PartyChatPanel';
import TaxiFareSplit from '../components/party/TaxiFareSplit';
import { usePartyRealtime } from '../hooks/usePartyRealtime';
import ProfileSettings from '../components/profile/ProfileSettings';

export default function MyPartyPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [activeParties, setActiveParties] = useState([]);
  const [historyParties, setHistoryParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [memberReviewTarget, setMemberReviewTarget] = useState(null);
  const [memberScore, setMemberScore] = useState(5);
  const [memberComment, setMemberComment] = useState('');
  const [noShowTarget, setNoShowTarget] = useState(null);
  const [noShowReason, setNoShowReason] = useState('');

  const loadMyPage = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, activeRes, historyRes] = await Promise.all([
        getTrustDashboard(),
        getMyParties(),
        getMyPartyHistory(),
      ]);
      const dash = dashRes.data.data;
      setDashboard(dash);
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

  usePartyRealtime(
    selected?.id,
    async () => {
      if (!selected?.id) return;
      const res = await getPartyDetail(selected.id);
      setSelected(res.data.data);
      await loadMyPage();
    },
    Boolean(selected?.id),
  );

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

  const handleDissolve = async () => {
    if (!selected?.id) return;
    setActionLoading(true);
    try {
      await dissolveParty(selected.id);
      toast.success('파티가 해산되었습니다.');
      setSelected(null);
      await loadMyPage();
    } catch (err) {
      toast.error(err.response?.data?.message || '해산에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferHost = async (targetUserId) => {
    if (!selected?.id) return;
    setActionLoading(true);
    try {
      await transferHost(selected.id, targetUserId);
      toast.success('방장이 위임되었습니다.');
      const res = await getPartyDetail(selected.id);
      setSelected(res.data.data);
      await loadMyPage();
    } catch (err) {
      toast.error(err.response?.data?.message || '방장 위임에 실패했습니다.');
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
      toast.success('파티 평가를 저장했습니다.');
      setReviewTarget(null);
      await loadMyPage();
    } catch (err) {
      toast.error(err.response?.data?.message || '평가 저장에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitMemberReview = async () => {
    if (!memberReviewTarget) return;
    setActionLoading(true);
    try {
      await submitMemberReview(memberReviewTarget.partyId, {
        revieweeId: memberReviewTarget.userId,
        rating: memberScore,
        comment: memberComment.trim(),
      });
      toast.success('멤버 평가가 저장되었습니다.');
      setMemberReviewTarget(null);
      await loadMyPage();
    } catch (err) {
      toast.error(err.response?.data?.message || '멤버 평가에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitNoShow = async () => {
    if (!noShowTarget || !noShowReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await submitNoShowReport(noShowTarget.partyId, {
        reportedUserId: noShowTarget.userId,
        reason: noShowReason.trim(),
      });
      toast.success(res.data.message || '노쇼 신고가 접수되었습니다.');
      setNoShowTarget(null);
      setNoShowReason('');
      await loadMyPage();
    } catch (err) {
      toast.error(err.response?.data?.message || '노쇼 신고에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/90 via-white to-sky-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">마이페이지</h2>
          <p className="text-sm text-slate-500 font-medium">신뢰 지수, 이용 내역, 평가·노쇼 신고를 관리하세요.</p>
        </div>

        <ProfileHeader />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 p-1 rounded-2xl bg-slate-100/90 ring-1 ring-slate-200/60">
          {[
            { key: 'dashboard', label: '대시보드' },
            { key: 'active', label: `진행중 ${activeParties.length}` },
            { key: 'history', label: `이용내역 ${historyParties.length}` },
            { key: 'settings', label: '설정' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                tab === key
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-200/80'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && tab !== 'settings' ? (
          <div className="py-16 text-center text-gray-400">불러오는 중...</div>
        ) : tab === 'dashboard' ? (
          <TrustDashboard data={dashboard} />
        ) : tab === 'active' ? (
          <RideList parties={activeParties} onCardClick={(p) => openParty(p.id)} />
        ) : tab === 'history' ? (
          <div className="space-y-3">
            {historyParties.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center text-gray-400">
                지난 파티 기록이 아직 없습니다.
              </div>
            ) : historyParties.map((item) => (
              <HistoryCard
                key={item.party.id}
                item={item}
                onPartyReview={() => openReviewModal(item)}
                onMemberReview={(member) => setMemberReviewTarget({
                  partyId: item.party.id,
                  userId: member.userId,
                  alias: member.alias,
                })}
                onNoShow={(member) => setNoShowTarget({
                  partyId: item.party.id,
                  userId: member.userId,
                  alias: member.alias,
                })}
              />
            ))}
          </div>
        ) : (
          <ProfileSettings />
        )}

        {selected && (
          <PartyDetailModal
            selected={selected}
            actionLoading={actionLoading}
            onClose={() => setSelected(null)}
            onRefresh={async () => {
              if (!selected?.id) return;
              const res = await getPartyDetail(selected.id);
              setSelected(res.data.data);
            }}
            onLeave={handleLeave}
            onDissolve={handleDissolve}
            onTransferHost={handleTransferHost}
          />
        )}

        {reviewTarget && (
          <RatingModal
            title="파티 전체 평가"
            score={reviewScore}
            comment={reviewComment}
            onScore={setReviewScore}
            onComment={setReviewComment}
            onClose={() => setReviewTarget(null)}
            onSubmit={handleSubmitReview}
            loading={actionLoading}
          />
        )}

        {memberReviewTarget && (
          <RatingModal
            title={`${memberReviewTarget.alias} 평가`}
            score={memberScore}
            comment={memberComment}
            onScore={setMemberScore}
            onComment={setMemberComment}
            onClose={() => setMemberReviewTarget(null)}
            onSubmit={handleSubmitMemberReview}
            loading={actionLoading}
          />
        )}

        {noShowTarget && (
          <NoShowModal
            target={noShowTarget}
            reason={noShowReason}
            onReason={setNoShowReason}
            onClose={() => { setNoShowTarget(null); setNoShowReason(''); }}
            onSubmit={handleSubmitNoShow}
            loading={actionLoading}
          />
        )}
      </div>
    </div>
  );
}

function HistoryCard({ item, onPartyReview, onMemberReview, onNoShow }) {
  const party = item.party;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm shadow-slate-900/[0.04]">
      <p className="text-xs text-gray-400 mb-1">{formatDateTimeKST(party.departureTime)}</p>
      <p className="text-sm font-bold text-gray-900 mb-1">
        {party.pickupName || labelOf(party.departure)} → {party.destinationName || labelOf(party.destination)}
      </p>
      <p className="text-xs text-gray-500 mb-3">인원 {party.currentCount}/{party.maxCount}명</p>

      {item.receivedReviews?.length > 0 && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
          <p className="text-xs font-bold text-amber-800 mb-1">받은 평가</p>
          {item.receivedReviews.map((r) => (
            <p key={r.id} className="text-xs text-amber-900">
              {'★'.repeat(r.rating)} {r.reviewerAlias}
              {r.comment ? ` · ${r.comment}` : ''}
            </p>
          ))}
        </div>
      )}

      {!item.reviewed && (
        <button
          type="button"
          onClick={onPartyReview}
          className="w-full mb-2 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100"
        >
          파티 평가 남기기
        </button>
      )}
      {item.reviewed && (
        <div className="mb-2 rounded-xl bg-green-50 border border-green-100 px-3 py-2 text-sm text-green-700">
          파티 평가 완료 · {item.myRating}점
        </div>
      )}

      {(item.otherMembers ?? []).length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500">함께한 멤버</p>
          {item.otherMembers.map((m) => (
            <div key={m.userId} className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-700 flex-1">{m.alias}</span>
              {!m.reviewedByMe && (
                <button
                  type="button"
                  onClick={() => onMemberReview(m)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold"
                >
                  평가
                </button>
              )}
              {m.reviewedByMe && (
                <span className="text-xs text-green-600 font-semibold">평가완료</span>
              )}
              {!m.noShowReportedByMe && (
                <button
                  type="button"
                  onClick={() => onNoShow(m)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-semibold"
                >
                  노쇼 신고
                </button>
              )}
              {m.noShowReportedByMe && (
                <span className="text-xs text-slate-400">신고완료</span>
              )}
            </div>
          ))}
          <p className="text-[10px] text-slate-400">노쇼는 파티원 2명 신고 시 확정 · 누적 2회 시 7일 이용정지</p>
        </div>
      )}
    </div>
  );
}

function PartyDetailModal({ selected, actionLoading, onClose, onRefresh, onLeave, onDissolve, onTransferHost }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-t-3xl p-5 pb-7 border-t border-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-bold text-gray-900">내 파티 상세</p>
          {selected.isHost && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">방장</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">인원: {selected.currentCount}/{selected.maxCount}명</p>
        <TaxiFareSplit
          partyId={selected.id}
          totalTaxiFare={selected.totalTaxiFare}
          currentMembers={selected.currentCount}
          perPersonFare={selected.perPersonFare}
          taxiFareRemainder={selected.taxiFareRemainder}
          canSetTaxiFare={selected.canSetTaxiFare}
          onUpdated={onRefresh}
        />
        <div className="space-y-2 mb-4">
          {(selected.members ?? []).map((member) => (
            <div key={member.userId} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <span className="text-sm font-semibold text-gray-700">{member.alias}</span>
              {selected.isHost && !member.isHost && (
                <button type="button" onClick={() => onTransferHost(member.userId)} disabled={actionLoading} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600">방장 위임</button>
              )}
            </div>
          ))}
        </div>
        {selected.isHost && selected.currentCount === 1 && (
          <button type="button" onClick={onDissolve} disabled={actionLoading} className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold border border-red-200 mb-3">파티 해산</button>
        )}
        {!selected.isHost && (
          <button type="button" onClick={onLeave} disabled={actionLoading} className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold border border-red-200 mb-3">파티 나가기</button>
        )}
        <PartyChatPanel partyId={selected.id} />
      </div>
    </div>
  );
}

function RatingModal({ title, score, comment, onScore, onComment, onClose, onSubmit, loading }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[70] flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-t-3xl p-5 pb-7" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onScore(n)} className={`text-2xl ${n <= score ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>
          ))}
        </div>
        <textarea rows={3} value={comment} onChange={(e) => onComment(e.target.value)} maxLength={300} placeholder="메모 (선택)" className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-400" />
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold">취소</button>
          <button type="button" onClick={onSubmit} disabled={loading} className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-semibold disabled:opacity-60">저장</button>
        </div>
      </div>
    </div>
  );
}

function NoShowModal({ target, reason, onReason, onClose, onSubmit, loading }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[70] flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-t-3xl p-5 pb-7" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">노쇼 신고</h3>
        <p className="text-sm text-gray-500 mb-4">{target.alias} · 정당한 사유 없이 불참한 경우에만 신고해주세요.</p>
        <textarea rows={4} value={reason} onChange={(e) => onReason(e.target.value)} maxLength={500} placeholder="신고 사유를 입력해주세요 (필수)" className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-red-400" />
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold">취소</button>
          <button type="button" onClick={onSubmit} disabled={loading || !reason.trim()} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-60">신고하기</button>
        </div>
      </div>
    </div>
  );
}

function ProfileHeader() {
  const email = localStorage.getItem('userEmail') ?? '';
  const initial = (email || '?').charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.04] mb-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center shrink-0">
        <span className="text-lg font-extrabold text-blue-700">{initial}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900 truncate">{email || '—'}</p>
        <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
          🎓 연세대 이메일 인증
        </span>
      </div>
    </div>
  );
}

function labelOf(key) {
  return LOCATIONS.find((l) => l.key === key)?.label || key;
}

