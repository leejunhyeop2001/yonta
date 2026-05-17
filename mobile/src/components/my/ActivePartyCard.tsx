import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PartyMembership } from '../../lib/types';
import { formatKST } from '../../lib/slots';
import { colors, radius } from '../../theme';

const STATUS_LABEL: Record<string, string> = {
  PENDING: '모집중',
  ACTIVE: '출발',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

export function ActivePartyCard({ party, onPress }: { party: PartyMembership; onPress: () => void }) {
  const timeLabel = formatKST(party.startTimeSlotMs);
  const status = STATUS_LABEL[party.status] ?? party.status;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <Text style={styles.time}>{timeLabel}</Text>
        <View style={[styles.badge, party.status === 'PENDING' && styles.badgeRecruit]}>
          <Text style={[styles.badgeText, party.status === 'PENDING' && styles.badgeTextRecruit]}>
            {status}
          </Text>
        </View>
      </View>
      <Text style={styles.route}>
        {party.pickupName} → {party.destinationName}
      </Text>
      <Text style={styles.meta}>
        {party.currentMembers}/{party.capacity}명 · {party.role === 'HOST' ? '방장' : '멤버'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 10,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  time: { fontSize: 16, fontWeight: '800', color: colors.text },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#F1F5F9',
  },
  badgeRecruit: { backgroundColor: '#DCFCE7' },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  badgeTextRecruit: { color: '#15803D' },
  route: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  meta: { fontSize: 12, color: colors.textSecondary },
});
