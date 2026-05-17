import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, radius } from '../theme';

export function ArrivalScreen() {
  const {
    loading,
    message,
    activePartyForArrival,
    confirmArrival,
    leaveParty,
    formatKST,
  } = useApp();

  const p = activePartyForArrival;

  const onLeave = () => {
    if (!p) return;
    const isHost = p.role === 'HOST';
    Alert.alert(
      isHost ? '파티 취소' : '파티 나가기',
      isHost
        ? '호스트가 나가면 파티가 취소되고 모든 멤버가 빠져나갑니다. 진행할까요?'
        : '이 파티에서 나가시겠어요?',
      [
        { text: '닫기', style: 'cancel' },
        {
          text: isHost ? '취소하기' : '나가기',
          style: 'destructive',
          onPress: () => void leaveParty(p.partyId),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>도착 인증</Text>
        <Text style={styles.sub}>픽업 시간 전후로 출발 지점 근처에서 위치로 인증해요.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>내 파티</Text>
          {!p ? (
            <Text style={styles.valueMuted}>참여 중인 파티가 없어요. 매칭 탭에서 만들거나 참여해 보세요.</Text>
          ) : (
            <>
              <Text style={styles.route}>
                {(p.pickupName || '출발').trim()} → {(p.destinationName || '도착').trim()}
              </Text>
              <Text style={styles.time}>{formatKST(new Date(p.startTime).getTime())}</Text>
              <Text style={styles.meta}>
                {p.role === 'HOST' ? '호스트' : '멤버'} · {p.currentMembers}/{p.capacity}명 · 도착{' '}
                {p.myArrivalStatus === 'ARRIVED' ? '완료' : p.myArrivalStatus === 'NOSHOW' ? '노쇼' : '대기'}
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.primary, !p && styles.primaryDisabled]}
          onPress={confirmArrival}
          disabled={loading || !p}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>현재 위치로 도착 인증</Text>
          )}
        </TouchableOpacity>

        {!!p && (
          <TouchableOpacity style={styles.dangerOutline} onPress={onLeave} disabled={loading}>
            <Text style={styles.dangerOutlineText}>{p.role === 'HOST' ? '파티 취소' : '파티 나가기'}</Text>
          </TouchableOpacity>
        )}

        {!!message && <Text style={styles.msg}>{message}</Text>}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 20,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  valueMuted: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  route: { fontSize: 17, fontWeight: '800', color: colors.primary, marginBottom: 6 },
  time: { fontSize: 20, fontWeight: '800', color: colors.text },
  meta: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 6 },
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  dangerOutline: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerOutlineText: { fontSize: 16, fontWeight: '700', color: colors.danger },
  msg: { marginTop: 16, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
