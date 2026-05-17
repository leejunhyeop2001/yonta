import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SlotStrip } from '../components/SlotStrip';
import { useApp } from '../context/AppContext';
import { formatKST, toSlotStartMs } from '../lib/slots';
import type { FixedPlace, PartySummary } from '../lib/types';
import type { MatchingStackParamList } from '../navigation/types';
import { colors, radius } from '../theme';

function formatPartyRoute(p: PartySummary) {
  const a = p.pickupName?.trim() || '출발';
  const b = p.destinationName?.trim() || '도착';
  return `${a} → ${b}`;
}

export function MatchingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MatchingStackParamList>>();
  const [pickModal, setPickModal] = useState<'pickup' | 'dest' | null>(null);

  const {
    loading,
    message,
    setMessage,
    slotMs,
    setSlotMs,
    fixedPlaces,
    routePickupPlaceId,
    setRoutePickupPlaceId,
    routeDestPlaceId,
    setRouteDestPlaceId,
    capacity,
    setCapacity,
    parties,
    selectedPartyId,
    setSelectedPartyId,
    refreshParties,
    createParty,
    joinParty,
    createPreferSameGender,
    setCreatePreferSameGender,
    createPreferQuiet,
    setCreatePreferQuiet,
    formatKST,
    toSlotStartMs: toSlot,
  } = useApp();

  const pickupPlace = fixedPlaces.find((p) => p.id === routePickupPlaceId);
  const destPlace = fixedPlaces.find((p) => p.id === routeDestPlaceId);

  const placesForModal = useMemo(() => {
    if (pickModal === 'pickup') return fixedPlaces.filter((p) => !p.destOnly);
    if (pickModal === 'dest') return fixedPlaces.filter((p) => !p.pickupOnly);
    return [];
  }, [pickModal, fixedPlaces]);

  const openPicker = (which: 'pickup' | 'dest') => {
    if (fixedPlaces.length === 0) {
      setMessage('장소 목록을 불러오지 못했습니다. 서버를 확인해 주세요.');
      return;
    }
    setPickModal(which);
  };

  const onPickPlace = (place: FixedPlace) => {
    if (pickModal === 'pickup') setRoutePickupPlaceId(place.id);
    if (pickModal === 'dest') setRouteDestPlaceId(place.id);
    setPickModal(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.screenTitle}>매칭</Text>
        <Text style={styles.screenSub}>정해진 장소와 시간으로 합승 파티를 찾거나 만들어요.</Text>

        <Text style={styles.fixedHint}>출발·도착은 서비스에서 정해 둔 장소 목록 중에서만 선택할 수 있어요.</Text>

        <View style={styles.card}>
          <SlotStrip valueMs={slotMs} onChange={(ms) => setSlotMs(toSlot(ms))} />
          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={[styles.pillBtn, styles.pillBtnOutline]}
              onPress={() => setSlotMs((ms) => toSlot(ms - 10 * 60 * 1000))}
            >
              <Text style={styles.pillBtnOutlineText}>−10분</Text>
            </TouchableOpacity>
            <Text style={styles.slotText}>{formatKST(slotMs)}</Text>
            <TouchableOpacity
              style={[styles.pillBtn, styles.pillBtnOutline]}
              onPress={() => setSlotMs((ms) => toSlot(ms + 10 * 60 * 1000))}
            >
              <Text style={styles.pillBtnOutlineText}>+10분</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>경로</Text>
          <Text style={styles.fieldHint}>같은 경로·시간대의 파티만 검색됩니다.</Text>

          <Text style={styles.fieldLabel}>출발</Text>
          <TouchableOpacity style={styles.selectRow} onPress={() => openPicker('pickup')}>
            <Text style={[styles.selectValue, !pickupPlace && styles.selectPlaceholder]}>
              {pickupPlace ? pickupPlace.label : '장소 선택'}
            </Text>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>도착</Text>
          <TouchableOpacity style={styles.selectRow} onPress={() => openPicker('dest')}>
            <Text style={[styles.selectValue, !destPlace && styles.selectPlaceholder]}>
              {destPlace ? destPlace.label : '장소 선택'}
            </Text>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>동성 매칭 우선</Text>
            <Switch value={createPreferSameGender} onValueChange={setCreatePreferSameGender} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>조용히 이동 선호</Text>
            <Switch value={createPreferQuiet} onValueChange={setCreatePreferQuiet} />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>정원</Text>
            <TextInput
              value={capacity}
              onChangeText={setCapacity}
              style={[styles.input, { width: 72, marginBottom: 0, flex: 0 }]}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.smallPrimary} onPress={() => void refreshParties()} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.smallPrimaryText}>새로고침</Text>}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.primaryFull} onPress={createParty} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryFullText}>파티 만들기</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>열린 파티</Text>
          {parties.length === 0 ? (
            <Text style={styles.empty}>
              {fixedPlaces.length === 0
                ? '고정 장소 목록을 불러오지 못했습니다.'
                : !pickupPlace || !destPlace
                  ? '출발·도착 장소를 선택하면 목록이 보여요.'
                  : '이 시간·경로에 열린 파티가 없어요.'}
            </Text>
          ) : (
            parties.map((p) => (
              <View key={p.partyId} style={styles.partyRow}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('PartyDetail', { partyId: p.partyId })}
                >
                  <Text style={styles.routeLine}>{formatPartyRoute(p)}</Text>
                  <Text style={styles.partyTime}>
                    {formatKST(new Date(p.startTime).getTime())} · {p.currentMembers}/{p.capacity}명
                  </Text>
                  <Text style={styles.partyMeta}>남은 자리 {p.availableSlots}</Text>
                  <View style={styles.partyBadges}>
                    {p.preferSameGender ? (
                      <View style={styles.miniBadge}>
                        <Text style={styles.miniBadgeText}>동성</Text>
                      </View>
                    ) : null}
                    {p.preferQuiet ? (
                      <View style={styles.miniBadge}>
                        <Text style={styles.miniBadgeText}>조용히</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
                <View style={styles.partyActions}>
                  <TouchableOpacity
                    style={[styles.miniGhost, selectedPartyId === p.partyId && styles.miniGhostOn]}
                    onPress={() => setSelectedPartyId(p.partyId)}
                  >
                    <Text style={[styles.miniGhostText, selectedPartyId === p.partyId && styles.miniGhostTextOn]}>
                      선택
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.miniPrimary} onPress={() => void joinParty(p.partyId)}>
                    <Text style={styles.miniPrimaryText}>참여</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {!!message && <Text style={styles.toast}>{message}</Text>}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={pickModal !== null} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPickModal(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pickModal === 'pickup' ? '출발 장소' : '도착 장소'}</Text>
            <FlatList
              data={placesForModal}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.modalEmpty}>선택 가능한 장소가 없습니다.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalRow} onPress={() => onPickPlace(item)}>
                  <Text style={styles.modalRowText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  screenSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
  fixedHint: { fontSize: 12, color: colors.muted, marginBottom: 12, lineHeight: 18 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  fieldHint: { fontSize: 12, color: colors.muted, marginBottom: 12, lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  selectValue: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  selectPlaceholder: { color: colors.muted, fontWeight: '500' },
  chev: { fontSize: 22, color: colors.muted, fontWeight: '300' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  pillBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    minWidth: 72,
    alignItems: 'center',
  },
  pillBtnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFAFA',
  },
  pillBtnOutlineText: { fontSize: 14, fontWeight: '600', color: colors.text },
  slotText: { fontSize: 16, fontWeight: '700', color: colors.text },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  input: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  smallPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    minWidth: 88,
    alignItems: 'center',
  },
  smallPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  primaryFull: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryFullText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  empty: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  routeLine: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  partyTime: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  partyMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  partyBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E8F0FF',
  },
  miniBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  partyActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  miniGhost: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniGhostOn: { borderColor: colors.primary, backgroundColor: '#E8F0FF' },
  miniGhostText: { fontSize: 13, fontWeight: '600', color: colors.text },
  miniGhostTextOn: { color: colors.primary },
  miniPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  miniPrimaryText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  toast: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    maxHeight: '70%',
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalRow: { paddingHorizontal: 16, paddingVertical: 14 },
  modalRowText: { fontSize: 16, fontWeight: '600', color: colors.text },
  modalEmpty: { padding: 20, fontSize: 14, color: colors.muted, textAlign: 'center' },
});
