import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivePartyCard } from '../components/my/ActivePartyCard';
import { HistoryCard } from '../components/my/HistoryCard';
import { NoShowModal } from '../components/my/NoShowModal';
import { RatingModal } from '../components/my/RatingModal';
import { TrustDashboard } from '../components/trust/TrustDashboard';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import type { HistoryItem, HistoryMember, TrustDashboardData } from '../lib/myPageTypes';
import type { PartyMembership, UserProfile } from '../lib/types';
import type { MainTabParamList } from '../navigation/types';
import { colors, radius } from '../theme';

type TabKey = 'dashboard' | 'active' | 'history' | 'settings';

const GENDERS: { key: UserProfile['gender']; label: string }[] = [
  { key: 'UNSPECIFIED', label: '미선택' },
  { key: 'MALE', label: '남성' },
  { key: 'FEMALE', label: '여성' },
];

export function ProfileScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Profile'>>();
  const {
    accessToken,
    userEmail,
    logout,
    profile,
    updateProfile,
    refreshProfile,
    refreshMyParties,
    myParties,
    setAccountPassword,
    loading: appLoading,
  } = useApp();

  const [tab, setTab] = useState<TabKey>('dashboard');
  const [dashboard, setDashboard] = useState<TrustDashboardData | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<UserProfile['gender']>('UNSPECIFIED');
  const [prefersQuiet, setPrefersQuiet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [reviewTarget, setReviewTarget] = useState<HistoryItem | null>(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [memberTarget, setMemberTarget] = useState<{ partyId: string; userId: string; alias: string } | null>(null);
  const [memberScore, setMemberScore] = useState(5);
  const [memberComment, setMemberComment] = useState('');
  const [noShowTarget, setNoShowTarget] = useState<{ partyId: string; userId: string; alias: string } | null>(null);
  const [noShowReason, setNoShowReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const activeParties = myParties.filter((p) => p.status === 'PENDING' || p.status === 'ACTIVE');

  useEffectProfile(profile, setFullName, setGender, setPrefersQuiet);

  const loadPage = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [dash, historyRes] = await Promise.all([
        apiFetch<TrustDashboardData>('/users/me/dashboard', { token: accessToken }),
        apiFetch<{ items: HistoryItem[] }>('/parties/me/history', { token: accessToken }),
      ]);
      setDashboard(dash);
      setHistoryItems(historyRes.items ?? []);
      await refreshMyParties();
    } catch (e) {
      setSaveMsg((e as Error).message);
    }
  }, [accessToken, refreshMyParties]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadPage().finally(() => setLoading(false));
      void refreshProfile();
    }, [loadPage, refreshProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPage();
    setRefreshing(false);
  };

  const openParty = (partyId: string) => {
    navigation.navigate('Matching', {
      screen: 'PartyDetail',
      params: { partyId },
    });
  };

  const onSaveProfile = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await updateProfile({ fullName: fullName.trim() || undefined, gender, prefersQuiet });
      setSaveMsg('저장했습니다.');
    } catch (e) {
      setSaveMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    await setAccountPassword(newPassword, confirmPassword);
    setNewPassword('');
    setConfirmPassword('');
  };

  const submitPartyReview = async () => {
    if (!reviewTarget || !accessToken) return;
    setActionLoading(true);
    try {
      await apiFetch(`/parties/${reviewTarget.party.id}/reviews`, {
        method: 'POST',
        token: accessToken,
        body: { rating: reviewScore, comment: reviewComment.trim() },
      });
      setReviewTarget(null);
      await loadPage();
    } catch (e) {
      Alert.alert('오류', (e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitMemberReview = async () => {
    if (!memberTarget || !accessToken) return;
    setActionLoading(true);
    try {
      await apiFetch(`/parties/${memberTarget.partyId}/member-reviews`, {
        method: 'POST',
        token: accessToken,
        body: {
          revieweeId: memberTarget.userId,
          rating: memberScore,
          comment: memberComment.trim(),
        },
      });
      setMemberTarget(null);
      await loadPage();
    } catch (e) {
      Alert.alert('오류', (e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitNoShow = async () => {
    if (!noShowTarget || !accessToken || !noShowReason.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`/parties/${noShowTarget.partyId}/no-show-reports`, {
        method: 'POST',
        token: accessToken,
        body: { reportedUserId: noShowTarget.userId, reason: noShowReason.trim() },
      });
      setNoShowTarget(null);
      setNoShowReason('');
      await loadPage();
    } catch (e) {
      Alert.alert('오류', (e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const onLogout = () => {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const initial = (userEmail ?? '?').charAt(0).toUpperCase();
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dashboard', label: '대시보드' },
    { key: 'active', label: `진행중 ${activeParties.length}` },
    { key: 'history', label: `이용내역 ${historyItems.length}` },
    { key: 'settings', label: '설정' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        <Text style={styles.title}>마이페이지</Text>
        <Text style={styles.subtitle}>신뢰 지수, 이용 내역, 평가·노쇼 신고를 관리하세요.</Text>

        <View style={styles.profileMini}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileMiniText}>
            <Text style={styles.email} numberOfLines={1}>
              {userEmail ?? '—'}
            </Text>
            <View style={styles.badge}>
              <Ionicons name="school-outline" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>연세대 이메일 인증</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          {tabs.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, tab === key && styles.tabOn]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextOn]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && tab !== 'settings' ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
        ) : tab === 'dashboard' ? (
          <TrustDashboard data={dashboard} />
        ) : tab === 'active' ? (
          activeParties.length === 0 ? (
            <EmptyBox text="진행 중인 파티가 없습니다." />
          ) : (
            activeParties.map((p) => (
              <ActivePartyCard key={p.partyId} party={p} onPress={() => openParty(p.partyId)} />
            ))
          )
        ) : tab === 'history' ? (
          historyItems.length === 0 ? (
            <EmptyBox text="지난 파티 기록이 아직 없습니다." />
          ) : (
            historyItems.map((item) => (
              <HistoryCard
                key={item.party.id}
                item={item}
                onPartyReview={() => {
                  setReviewTarget(item);
                  setReviewScore(5);
                  setReviewComment('');
                }}
                onMemberReview={(m: HistoryMember) => {
                  setMemberTarget({ partyId: item.party.id, userId: m.userId, alias: m.alias });
                  setMemberScore(5);
                  setMemberComment('');
                }}
                onNoShow={(m: HistoryMember) => {
                  setNoShowTarget({ partyId: item.party.id, userId: m.userId, alias: m.alias });
                  setNoShowReason('');
                }}
              />
            ))
          )
        ) : (
          <SettingsSection
            fullName={fullName}
            setFullName={setFullName}
            gender={gender}
            setGender={setGender}
            prefersQuiet={prefersQuiet}
            setPrefersQuiet={setPrefersQuiet}
            profile={profile}
            saving={saving}
            saveMsg={saveMsg}
            onSave={onSaveProfile}
            hasPassword={profile?.hasPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            onChangePassword={onChangePassword}
            appLoading={appLoading}
          />
        )}

        <TouchableOpacity style={styles.logout} onPress={onLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>

      <RatingModal
        visible={!!reviewTarget}
        title="파티 전체 평가"
        score={reviewScore}
        comment={reviewComment}
        loading={actionLoading}
        onScore={setReviewScore}
        onComment={setReviewComment}
        onClose={() => setReviewTarget(null)}
        onSubmit={() => void submitPartyReview()}
      />
      <RatingModal
        visible={!!memberTarget}
        title={memberTarget ? `${memberTarget.alias} 평가` : ''}
        score={memberScore}
        comment={memberComment}
        loading={actionLoading}
        onScore={setMemberScore}
        onComment={setMemberComment}
        onClose={() => setMemberTarget(null)}
        onSubmit={() => void submitMemberReview()}
      />
      <NoShowModal
        visible={!!noShowTarget}
        alias={noShowTarget?.alias ?? ''}
        reason={noShowReason}
        loading={actionLoading}
        onReason={setNoShowReason}
        onClose={() => {
          setNoShowTarget(null);
          setNoShowReason('');
        }}
        onSubmit={() => void submitNoShow()}
      />
    </SafeAreaView>
  );
}

function useEffectProfile(
  profile: UserProfile | null,
  setFullName: (v: string) => void,
  setGender: (v: UserProfile['gender']) => void,
  setPrefersQuiet: (v: boolean) => void,
) {
  React.useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? '');
    setGender(profile.gender);
    setPrefersQuiet(profile.prefersQuiet);
  }, [profile, setFullName, setGender, setPrefersQuiet]);
}

function EmptyBox({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function SettingsSection({
  fullName,
  setFullName,
  gender,
  setGender,
  prefersQuiet,
  setPrefersQuiet,
  profile,
  saving,
  saveMsg,
  onSave,
  hasPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onChangePassword,
  appLoading,
}: {
  fullName: string;
  setFullName: (v: string) => void;
  gender: UserProfile['gender'];
  setGender: (v: UserProfile['gender']) => void;
  prefersQuiet: boolean;
  setPrefersQuiet: (v: boolean) => void;
  profile: UserProfile | null;
  saving: boolean;
  saveMsg: string | null;
  onSave: () => void;
  hasPassword?: boolean;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  onChangePassword: () => void;
  appLoading: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>프로필</Text>
      <Text style={styles.fieldLabel}>표시 이름</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="이름 (선택)"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.fieldLabel}>성별</Text>
      <View style={styles.genderRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[styles.genderChip, gender === g.key && styles.genderChipOn]}
            onPress={() => setGender(g.key)}
          >
            <Text style={[styles.genderChipText, gender === g.key && styles.genderChipTextOn]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>조용한 합승 선호</Text>
        <Switch value={prefersQuiet} onValueChange={setPrefersQuiet} />
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving || !profile}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>저장</Text>}
      </TouchableOpacity>
      {!!saveMsg && <Text style={styles.saveMsg}>{saveMsg}</Text>}
      {profile && (
        <Text style={styles.metaLine}>
          매너 온도 {profile.mannerTemperature}° · 프로필은 서버에 반영됩니다.
        </Text>
      )}

      <View style={styles.divider} />
      <Text style={styles.cardTitle}>비밀번호</Text>
      <Text style={styles.pwHint}>
        {hasPassword
          ? '새 비밀번호를 입력하면 변경됩니다. (8자 이상)'
          : 'OTP 로그인 후 비밀번호를 설정하면 다음부터 비밀번호로 로그인할 수 있습니다.'}
      </Text>
      <Text style={styles.fieldLabel}>새 비밀번호</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={hasPassword ? 'password' : 'newPassword'}
        placeholder="8자 이상"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.fieldLabel}>비밀번호 확인</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        placeholder="다시 입력"
        placeholderTextColor={colors.muted}
      />
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => void onChangePassword()}
        disabled={appLoading || newPassword.length < 8}
      >
        <Text style={styles.saveBtnText}>{hasPassword ? '비밀번호 변경' : '비밀번호 설정'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 16, lineHeight: 18 },
  profileMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 14,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: colors.primary },
  profileMiniText: { flex: 1 },
  email: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#E8F0FF',
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: 14,
  },
  tab: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 72,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  tabOn: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  tabTextOn: { color: colors.text },
  empty: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyText: { fontSize: 14, color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
  },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  genderChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFAFA',
  },
  genderChipOn: { borderColor: colors.primary, backgroundColor: '#E8F0FF' },
  genderChipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  genderChipTextOn: { color: colors.primary },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  saveMsg: { marginTop: 10, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  metaLine: { marginTop: 10, fontSize: 12, color: colors.muted, textAlign: 'center' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  pwHint: { fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  logout: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.danger },
});
