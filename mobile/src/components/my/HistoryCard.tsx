import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { HistoryItem, HistoryMember } from '../../lib/myPageTypes';
import { formatKST } from '../../lib/slots';
import { colors, radius } from '../../theme';

type Props = {
  item: HistoryItem;
  onPartyReview: () => void;
  onMemberReview: (member: HistoryMember) => void;
  onNoShow: (member: HistoryMember) => void;
};

export function HistoryCard({ item, onPartyReview, onMemberReview, onNoShow }: Props) {
  const party = item.party;
  const timeLabel = formatKST(new Date(party.departureTime).getTime());

  return (
    <View style={styles.card}>
      <Text style={styles.time}>{timeLabel}</Text>
      <Text style={styles.route}>
        {party.pickupName} → {party.destinationName}
      </Text>
      <Text style={styles.meta}>
        인원 {party.currentCount}/{party.maxCount}명
      </Text>

      {item.receivedReviews.length > 0 && (
        <View style={styles.receivedBox}>
          <Text style={styles.receivedTitle}>받은 평가</Text>
          {item.receivedReviews.map((r) => (
            <Text key={r.id} style={styles.receivedLine}>
              {'★'.repeat(r.rating)} {r.reviewerAlias}
              {r.comment ? ` · ${r.comment}` : ''}
            </Text>
          ))}
        </View>
      )}

      {!item.reviewed ? (
        <TouchableOpacity style={styles.partyReviewBtn} onPress={onPartyReview}>
          <Text style={styles.partyReviewBtnText}>파티 평가 남기기</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.doneBox}>
          <Text style={styles.doneText}>파티 평가 완료 · {item.myRating}점</Text>
        </View>
      )}

      {item.otherMembers.length > 0 && (
        <View style={styles.membersBlock}>
          <Text style={styles.membersTitle}>함께한 멤버</Text>
          {item.otherMembers.map((m) => (
            <View key={m.userId} style={styles.memberRow}>
              <Text style={styles.memberName}>{m.alias}</Text>
              <View style={styles.memberActions}>
                {!m.reviewedByMe ? (
                  <TouchableOpacity style={styles.actionChipBlue} onPress={() => onMemberReview(m)}>
                    <Text style={styles.actionChipBlueText}>평가</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.actionDone}>평가완료</Text>
                )}
                {!m.noShowReportedByMe ? (
                  <TouchableOpacity style={styles.actionChipRed} onPress={() => onNoShow(m)}>
                    <Text style={styles.actionChipRedText}>노쇼 신고</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.actionMuted}>신고완료</Text>
                )}
              </View>
            </View>
          ))}
          <Text style={styles.noshowHint}>
            노쇼는 파티원 2명 신고 시 확정 · 누적 2회 시 7일 이용정지
          </Text>
        </View>
      )}
    </View>
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
  time: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  route: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  meta: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  receivedBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 10,
  },
  receivedTitle: { fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  receivedLine: { fontSize: 12, color: '#78350F', marginBottom: 2 },
  partyReviewBtn: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  partyReviewBtnText: { fontSize: 14, fontWeight: '600', color: '#1D4ED8' },
  doneBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 8,
  },
  doneText: { fontSize: 14, fontWeight: '600', color: '#15803D' },
  membersBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  membersTitle: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 8 },
  memberRow: { marginBottom: 10 },
  memberName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  memberActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  actionChipBlue: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: '#EFF6FF',
  },
  actionChipBlueText: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  actionChipRed: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: '#FEF2F2',
  },
  actionChipRedText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  actionDone: { fontSize: 12, fontWeight: '600', color: '#16A34A' },
  actionMuted: { fontSize: 12, color: colors.muted },
  noshowHint: { fontSize: 10, color: colors.muted, marginTop: 4, lineHeight: 14 },
});
