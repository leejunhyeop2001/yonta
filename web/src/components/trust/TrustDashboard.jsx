import { tempBg, tempColor, trustMeta } from '../../utils/mannerTemp';

export default function TrustDashboard({ data }) {
  if (!data) return null;

  const level = trustMeta(data.trustLevel);
  const tempPercent = Math.min(100, Math.max(0, data.mannerTemp));

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">신뢰 지수</p>
          <p className={`text-2xl font-extrabold mt-1 ${level.color}`}>{level.label}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ring-1 ${level.bg} ${level.color} ${level.ring}`}>
          {data.trustLevelLabel || level.label}
        </div>
      </div>

      {data.suspended && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          이용 정지 중입니다.
          {data.suspendedUntil && (
            <span className="block text-xs mt-1 text-red-500">
              해제 예정: {data.suspendedUntil.slice(0, 16).replace('T', ' ')}
            </span>
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">매너 온도</span>
          <span className={`text-2xl font-black tabular-nums ${tempColor(data.mannerTemp)}`}>
            {data.mannerTemp.toFixed(1)}°
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${tempBg(data.mannerTemp)}`}
            style={{ width: `${tempPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">36.5° 기본 · 평가·노쇼에 따라 변동</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <StatBox label="받은 평가" value={data.totalReviewsReceived} sub={data.averageRatingReceived != null ? `평균 ${data.averageRatingReceived.toFixed(1)}점` : '-'} />
        <StatBox label="참여 파티" value={data.totalPartiesJoined} />
        <StatBox label="노쇼 확정" value={data.noShowCount} warn={data.noShowCount > 0} />
      </div>

      {data.recentReviewsReceived?.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-2">최근 받은 평가</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {data.recentReviewsReceived.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="font-bold text-yellow-500">{'★'.repeat(r.rating)}</span>
                <span className="text-slate-500 ml-2">{r.reviewerAlias}</span>
                {r.comment && <p className="text-slate-600 mt-1 line-clamp-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StatBox({ label, value, sub, warn }) {
  return (
    <div className={`rounded-xl px-2 py-2.5 ${warn ? 'bg-red-50' : 'bg-slate-50'}`}>
      <p className="text-[10px] text-slate-400 font-semibold">{label}</p>
      <p className={`text-lg font-extrabold ${warn ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
