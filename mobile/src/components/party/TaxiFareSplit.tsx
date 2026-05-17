import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiFetch } from '../../lib/api';
import { computePerPersonTaxiFare, formatWon } from '../../lib/taxiFare';
import { colors, radius } from '../../theme';

type Props = {
  partyId: string;
  accessToken: string;
  totalTaxiFare: number | null;
  currentMembers: number;
  perPersonFare: number | null;
  taxiFareRemainder?: number;
  canSetTaxiFare: boolean;
  onUpdated: () => void;
};

export function TaxiFareSplit({
  partyId,
  accessToken,
  totalTaxiFare,
  currentMembers,
  perPersonFare: perPersonFromServer,
  taxiFareRemainder = 0,
  canSetTaxiFare,
  onUpdated,
}: Props) {
  const [input, setInput] = useState(totalTaxiFare != null ? String(totalTaxiFare) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(totalTaxiFare != null ? String(totalTaxiFare) : '');
  }, [totalTaxiFare]);

  const parsed = Number(input.replace(/\D/g, ''));
  const preview = computePerPersonTaxiFare(parsed > 0 ? parsed : null, currentMembers);
  const displayPerPerson = perPersonFromServer ?? preview.perPersonFare;
  const displayRemainder = totalTaxiFare != null ? taxiFareRemainder : preview.remainder;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const fare = parsed > 0 ? parsed : 0;
      await apiFetch(`/parties/${partyId}/taxi-fare`, {
        method: 'PATCH',
        token: accessToken,
        body: { totalTaxiFare: fare },
      });
      onUpdated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🚕 택시비 N분의 1</Text>
      <Text style={styles.hint}>
        총 택시비를 입력하면 현재 인원({currentMembers}명)으로 나눕니다.
      </Text>

      {canSetTaxiFare && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(t) => setInput(t.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            placeholder="총 택시비 (원)"
            placeholderTextColor={colors.muted}
          />
          <TouchableOpacity
            style={[styles.saveBtn, (!input || saving) && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={!input || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>저장</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      {displayPerPerson != null ? (
        <View style={styles.result}>
          <Text style={styles.formula}>
            {formatWon(totalTaxiFare ?? (parsed > 0 ? parsed : null))} ÷ {currentMembers}명
          </Text>
          <Text style={styles.perPerson}>인당 {formatWon(displayPerPerson)}</Text>
          {displayRemainder > 0 && (
            <Text style={styles.remainder}>
              올림 정산으로 인당 합계가 {formatWon(displayRemainder)} 많습니다.
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.empty}>
          {canSetTaxiFare ? '총 택시비를 입력하고 저장하세요.' : '방장이 택시비를 입력하면 표시됩니다.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEB',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  title: { fontSize: 15, fontWeight: '800', color: '#78350F', marginBottom: 6 },
  hint: { fontSize: 12, color: '#92400E', marginBottom: 12, lineHeight: 18 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: '#fff',
  },
  saveBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  error: { fontSize: 12, color: colors.danger, marginBottom: 8 },
  result: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  formula: { fontSize: 13, color: colors.textSecondary },
  perPerson: { fontSize: 22, fontWeight: '800', color: '#78350F', marginTop: 6 },
  remainder: { fontSize: 11, color: '#B45309', marginTop: 8, lineHeight: 16 },
  empty: { fontSize: 13, color: '#B45309' },
});
