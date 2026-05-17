import React, { useState } from 'react';
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
import { colors, radius } from '../theme';

export function SetPasswordScreen() {
  const { loading, message, setAccountPassword } = useApp();
  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>비밀번호 설정</Text>
          <Text style={styles.tagline}>한 번만 설정하면 다음부터 OTP 없이 로그인할 수 있어요</Text>

          <View style={styles.card}>
            <Text style={styles.label}>새 비밀번호</Text>
            <TextInput
              value={password}
              onChangeText={setPasswordValue}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="next"
              editable={!loading}
              placeholder="8자 이상"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="done"
              editable={!loading}
              placeholder="다시 입력"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => setAccountPassword(password, confirm)}
              disabled={loading || password.length < 8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>저장하고 시작하기</Text>
              )}
            </TouchableOpacity>

            {!!message && <Text style={styles.hint}>{message}</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  btnPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  btnPrimaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
