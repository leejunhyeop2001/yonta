import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { setPartyTaxiFare } from '../../api/rideApi';
import { computePerPersonTaxiFare, formatWon } from '../../utils/taxiFare';

export default function TaxiFareSplit({
  partyId,
  totalTaxiFare,
  currentMembers,
  perPersonFare: perPersonFromServer,
  taxiFareRemainder = 0,
  canSetTaxiFare,
  onUpdated,
}) {
  const [input, setInput] = useState(totalTaxiFare != null ? String(totalTaxiFare) : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInput(totalTaxiFare != null ? String(totalTaxiFare) : '');
  }, [totalTaxiFare]);

  const parsed = Number(String(input).replace(/\D/g, ''));
  const preview = computePerPersonTaxiFare(
    parsed > 0 ? parsed : null,
    currentMembers ?? 0,
  );
  const displayPerPerson = perPersonFromServer ?? preview.perPersonFare;
  const displayRemainder = totalTaxiFare != null ? taxiFareRemainder : preview.remainder;

  const handleSave = async () => {
    if (!partyId) return;
    setSaving(true);
    try {
      const fare = parsed > 0 ? parsed : 0;
      await setPartyTaxiFare(partyId, fare);
      toast.success(fare > 0 ? '택시비를 저장했습니다.' : '택시비를 삭제했습니다.');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || '택시비 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🚕</span>
        <h4 className="text-sm font-extrabold text-amber-950">택시비 N분의 1</h4>
      </div>
      <p className="text-xs text-amber-900/80 mb-3 font-medium">
        총 택시비를 입력하면 현재 인원({currentMembers}명)으로 N분의 1을 계산합니다.
      </p>

      {canSetTaxiFare && (
        <div className="space-y-2 mb-3">
          <label className="text-xs font-bold text-amber-900">총 택시비 (원)</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="예: 12000"
              className="flex-1 px-3 py-2.5 rounded-xl border border-amber-200 bg-white text-sm font-semibold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !input}
              className="px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold disabled:opacity-50 hover:bg-amber-700"
            >
              {saving ? '…' : '저장'}
            </button>
          </div>
        </div>
      )}

      {displayPerPerson != null ? (
        <div className="rounded-xl bg-white/90 border border-amber-100 px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-slate-600">
              {formatWon(totalTaxiFare ?? (parsed > 0 ? parsed : null))} ÷ {currentMembers}명
            </span>
            <span className="text-xl font-extrabold text-amber-900 tabular-nums">
              인당 {formatWon(displayPerPerson)}
            </span>
          </div>
          {displayRemainder > 0 && (
            <p className="text-[11px] text-amber-800/70 mt-2">
              올림 정산으로 인당 합계가 {formatWon(displayRemainder)} 많습니다. (호스트가 조정)
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-amber-800/60">
          {canSetTaxiFare ? '총 택시비를 입력하고 저장하세요.' : '방장이 택시비를 입력하면 표시됩니다.'}
        </p>
      )}
    </section>
  );
}
