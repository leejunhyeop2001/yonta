import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import type { PartyDetail, PartyMessage } from '../lib/types';
import { formatKST } from '../lib/slots';
import { TaxiFareSplit } from '../components/party/TaxiFareSplit';
import type { MatchingStackParamList } from '../navigation/types';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<MatchingStackParamList, 'PartyDetail'>;

const CHAT_POLL_MS = 2500;

export function PartyDetailScreen({ route, navigation }: Props) {
  const { partyId } = route.params;
  const { accessToken, userId, joinParty, loading, setSelectedPartyId } = useApp();
  const [data, setData] = useState<PartyDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chat, setChat] = useState('');
  const [sending, setSending] = useState(false);

  const loadPartyAndMessages = useCallback(
    async (opts?: { showMessageSpinner?: boolean }) => {
      if (!accessToken) return;
      if (opts?.showMessageSpinner) setLoadingMessages(true);
      try {
        const [detail, msgRes] = await Promise.all([
          apiFetch<PartyDetail>(`/parties/${partyId}`, { token: accessToken }),
          apiFetch<{ messages: PartyMessage[]; nextCursor: string | null }>(
            `/parties/${partyId}/messages`,
            { token: accessToken },
          ),
        ]);
        setData(detail);
        setMessages(msgRes.messages);
        setNextCursor(msgRes.nextCursor);
        setErr(null);
      } catch (e) {
        if (opts?.showMessageSpinner) setErr((e as Error).message);
      } finally {
        if (opts?.showMessageSpinner) setLoadingMessages(false);
      }
    },
    [accessToken, partyId],
  );

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return undefined;
      void loadPartyAndMessages({ showMessageSpinner: true });
      const id = setInterval(() => {
        void loadPartyAndMessages();
      }, CHAT_POLL_MS);
      return () => clearInterval(id);
    }, [accessToken, loadPartyAndMessages]),
  );

  const canChat = data?.status === 'PENDING' || data?.status === 'ACTIVE';

  const onSend = async () => {
    const text = chat.trim();
    if (!text || !accessToken || !canChat) return;
    setSending(true);
    try {
      await apiFetch<PartyMessage>(`/parties/${partyId}/messages`, {
        method: 'POST',
        token: accessToken,
        body: { content: text },
      });
      setChat('');
      await loadPartyAndMessages();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (err) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.err}>{err}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.route}>
          {(data.pickupName || '출발').trim()} → {(data.destinationName || '도착').trim()}
        </Text>
        <Text style={styles.time}>{formatKST(new Date(data.startTime).getTime())}</Text>
        <Text style={styles.meta}>
          인원 {data.currentMembers}/{data.capacity} · 남은 자리 {data.availableSlots}
        </Text>
        <View style={styles.badges}>
          {data.preferSameGender && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>동성 매칭</Text>
            </View>
          )}
          {data.preferQuiet && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>조용히 이동</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>호스트</Text>
          <Text style={styles.row}>{data.host.emailMasked}</Text>
          <Text style={styles.sub}>매너 {data.host.mannerTemperature}° · 성별 {data.host.gender}</Text>
        </View>

        {(data.isMember || data.isHost || data.canSetTaxiFare) && accessToken && (
          <TaxiFareSplit
            partyId={partyId}
            accessToken={accessToken}
            totalTaxiFare={data.totalTaxiFare ?? null}
            currentMembers={data.currentMembers}
            perPersonFare={data.perPersonFare ?? null}
            taxiFareRemainder={data.taxiFareRemainder ?? 0}
            canSetTaxiFare={Boolean(data.canSetTaxiFare)}
            onUpdated={() => void loadPartyAndMessages()}
          />
        )}

        <View style={styles.card}>
          <Text style={styles.section}>멤버</Text>
          {data.members.map((m) => (
            <View key={m.userId} style={styles.member}>
              <Text style={styles.row}>
                {m.emailMasked} · {m.role === 'HOST' ? '호스트' : '멤버'}
              </Text>
              <Text style={styles.sub}>도착: {m.arrivalStatus}</Text>
            </View>
          ))}
        </View>

          <TouchableOpacity
            style={styles.primary}
            disabled={loading}
            onPress={async () => {
              setSelectedPartyId(partyId);
              const ok = await joinParty(partyId);
              if (ok) navigation.goBack();
            }}
          >
            <Text style={styles.primaryText}>이 파티에 참여</Text>
          </TouchableOpacity>

          <View style={styles.chatBox}>
            <Text style={styles.chatTitle}>채팅</Text>
            {loadingMessages && messages.length === 0 ? (
              <ActivityIndicator color={colors.primary} />
            ) : messages.length === 0 ? (
              <Text style={styles.chatEmpty}>아직 메시지가 없어요. 먼저 인사를 남겨 보세요.</Text>
            ) : (
              messages.map((m) => {
                const mine = m.userId === userId;
                return (
                  <View
                    key={m.id}
                    style={[styles.msgRow, mine ? styles.msgRowMe : styles.msgRowOther]}
                  >
                    {!mine && <Text style={styles.msgName}>{m.displayName}</Text>}
                    <View
                      style={[
                        styles.msgBubble,
                        mine ? styles.msgBubbleMe : styles.msgBubbleOther,
                      ]}
                    >
                      <Text style={styles.msgText}>{m.content}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {canChat ? (
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={chat}
                onChangeText={setChat}
                placeholder="메시지 입력"
                placeholderTextColor={colors.muted}
              />
              <TouchableOpacity
                style={styles.chatSend}
                onPress={onSend}
                disabled={sending || !chat.trim()}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.chatSendText}>전송</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.chatClosed}>
              이 파티는 종료되어 새로운 채팅을 보낼 수 없어요.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scroll: { padding: 20 },
  route: { fontSize: 18, fontWeight: '800', color: colors.primary, marginBottom: 6 },
  time: { fontSize: 26, fontWeight: '800', color: colors.text },
  meta: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F0FF',
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  card: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 8 },
  row: { fontSize: 16, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  member: { marginBottom: 12 },
  primary: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  err: { color: colors.danger, fontSize: 15, padding: 20 },
  link: { color: colors.primary, fontSize: 16, paddingHorizontal: 20 },
  chatBox: {
    marginTop: 24,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  chatTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  chatEmpty: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  msgRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  msgRowMe: {
    alignItems: 'flex-end',
  },
  msgRowOther: {
    alignItems: 'flex-start',
  },
  msgName: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  msgBubble: {
    maxWidth: '80%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
  },
  msgBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  msgBubbleOther: {
    backgroundColor: '#E8F0FF',
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 14,
    color: '#fff',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#FAFAFA',
  },
  chatSend: {
    marginLeft: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  chatSendText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  chatClosed: {
    marginTop: 12,
    fontSize: 12,
    color: colors.muted,
  },
});
