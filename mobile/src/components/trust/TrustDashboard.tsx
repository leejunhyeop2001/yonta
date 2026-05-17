import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TrustDashboardData } from '../../lib/myPageTypes';
import { tempBg, tempColor, trustMeta } from '../../lib/mannerTemp';
import { colors, radius } from '../../theme';

export function TrustDashboard({ data }: { data: TrustDashboardData | null }) {
  if (!data) return null;

  const level = trustMeta(data.trustLevel);
  const tempPercent = Math.min(100, Math.max(0, data.mannerTemp));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>신뢰 지수</Text>
          <Text style={[styles.levelTitle, { color: level.color }]}>{level.label}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: level.bg }]}>
          <Text style={[styles.badgeText, { color: level.color }]}>
            {data.trustLevelLabel || level.label}
          </Text>
        </View>
      </View>

      {data.suspended && (
        <View style={styles.suspendedBox}>
          <Text style={styles.suspendedText}>이용 정지 중입니다.</Text>
          {!!data.suspendedUntil && (
            <Text style={styles.suspendedSub}>
              해제 예정: {data.suspendedUntil.slice(0, 16).replace('T', ' ')}
            </Text>
          )}
        </View>
      )}

      <View style={styles.tempBlock}>
        <View style={styles.tempRow}>
          <Text style={styles.tempLabel}>매너 온도</Text>
          <Text style={[styles.tempValue, { color: tempColor(data.mannerTemp) }]}>
            {data.mannerTemp.toFixed(1)}°
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, { width: `${tempPercent}%`, backgroundColor: tempBg(data.mannerTemp) }]}
          />
        </View>
        <Text style={styles.tempHint}>36.5° 기본 · 평가·노쇼에 따라 변동</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox
          label="받은 평가"
          value={String(data.totalReviewsReceived)}
          sub={
            data.averageRatingReceived != null
              ? `평균 ${data.averageRatingReceived.toFixed(1)}점`
              : '-'
          }
        />
        <StatBox label="참여 파티" value={String(data.totalPartiesJoined)} />
        <StatBox label="노쇼 확정" value={String(data.noShowCount)} warn={data.noShowCount > 0} />
      </View>

      {data.recentReviewsReceived.length > 0 && (
        <View style={styles.reviewsBlock}>
          <Text style={styles.reviewsTitle}>최근 받은 평가</Text>
          {data.recentReviewsReceived.slice(0, 5).map((r) => (
            <View key={r.id} style={styles.reviewItem}>
              <Text style={styles.stars}>{'★'.repeat(r.rating)}</Text>
              <Text style={styles.reviewer}> {r.reviewerAlias}</Text>
              {!!r.comment && <Text style={styles.reviewComment} numberOfLines={1}>{r.comment}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function StatBox({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <View style={[styles.statBox, warn && styles.statBoxWarn]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, warn && styles.statValueWarn]}>{value}</Text>
      {!!sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  kicker: { fontSize: 11, fontWeight: '600', color: colors.muted, letterSpacing: 0.5 },
  levelTitle: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  badgeText: { fontSize: 12, fontWeight: '700' },
  suspendedBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  suspendedText: { fontSize: 14, fontWeight: '600', color: '#B91C1C' },
  suspendedSub: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  tempBlock: { marginBottom: 14 },
  tempRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  tempLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  tempValue: { fontSize: 24, fontWeight: '800' },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  tempHint: { fontSize: 11, color: colors.muted, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statBoxWarn: { backgroundColor: '#FEF2F2' },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.muted },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2 },
  statValueWarn: { color: '#DC2626' },
  statSub: { fontSize: 9, color: colors.muted, marginTop: 2, textAlign: 'center' },
  reviewsBlock: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  reviewsTitle: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 8 },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 6,
  },
  stars: { color: '#EAB308', fontWeight: '700', fontSize: 12 },
  reviewer: { fontSize: 12, color: colors.muted },
  reviewComment: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
