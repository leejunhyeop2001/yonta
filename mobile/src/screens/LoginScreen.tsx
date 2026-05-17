import React, { useEffect, useState } from 'react';
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
import { colors, radius } from '../theme';

export function LoginScreen() {
  const {
    email,
    setEmail,
    otp,
    setOtp,
    loginMode,
    setLoginMode,
    loading,
    message,
    requestOtp,
    verifyOtp,
    loginWithPassword,
  } = useApp();

  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.endsWith('@yonsei.ac.kr')) {
      setHasPassword(null);
      return;
    }
    const timer = setTimeout(() => {
      void apiFetch<{ registered: boolean; hasPassword: boolean }>('/auth/account-status', {
        query: { email: trimmed },
      })
        .then((res) => {
          setHasPassword(res.hasPassword);
          if (res.registered && res.hasPassword) setLoginMode('password');
          else if (res.registered && !res.hasPassword) setLoginMode('otp');
        })
        .catch(() => setHasPassword(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [email, setLoginMode]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>연타</Text>
          <Text style={styles.tagline}>
            {hasPassword
              ? '연세대 재학생 전용 택시 합승'
              : '처음 이용 시 학교 메일 OTP 인증이 필요합니다'}
          </Text>

          {hasPassword !== true && (
            <View style={styles.guideBox}>
              <Text style={styles.guideTitle}>처음이신가요? OTP 인증부터 진행해 주세요</Text>
              <Text style={styles.guideText}>1. OTP 탭을 선택합니다</Text>
              <Text style={styles.guideText}>2. @yonsei.ac.kr 메일로 인증번호를 받아 로그인합니다</Text>
              <Text style={styles.guideText}>
                3. 로그인 후 비밀번호를 설정하면, 다음부터는 비밀번호로 로그인할 수 있습니다
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, loginMode === 'password' && styles.tabActive]}
                onPress={() => setLoginMode('password')}
              >
                <Text style={[styles.tabText, loginMode === 'password' && styles.tabTextActive]}>
                  비밀번호
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, loginMode === 'otp' && styles.tabActive]}
                onPress={() => setLoginMode('otp')}
              >
                <Text style={[styles.tabText, loginMode === 'otp' && styles.tabTextActive]}>OTP</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>학교 이메일</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@yonsei.ac.kr"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            {loginMode === 'password' ? (
              <>
                {hasPassword !== true && (
                  <Text style={styles.warn}>
                    비밀번호가 아직 없습니다. OTP 탭에서 학교 메일 인증 후 비밀번호를 설정해 주세요.
                  </Text>
                )}
                {hasPassword === true && (
                  <Text style={styles.forgotHint}>비밀번호를 잊으셨다면 OTP 탭에서 다시 인증할 수 있습니다.</Text>
                )}
                <Text style={styles.label}>비밀번호</Text>
                <TextInput
                  key="login-password"
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  editable={!loading}
                  placeholder="8자 이상"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => loginWithPassword(passwordInput)}
                  disabled={loading || passwordInput.length < 8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>로그인</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.otpSteps}>
                  1. 이메일 입력 후 「인증번호 받기」{'\n'}
                  2. 메일의 6자리 번호 입력 후 로그인{'\n'}
                  3. 로그인 후 비밀번호 설정 → 다음부터 비밀번호 탭 이용
                </Text>
                <TouchableOpacity style={styles.btnSecondary} onPress={requestOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.btnSecondaryText}>인증번호 받기</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>인증번호 (6자리)</Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />

                <TouchableOpacity style={styles.btnPrimary} onPress={verifyOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>OTP로 로그인</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

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
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.md - 2,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.primary,
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
  guideBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 12,
    color: '#075985',
    lineHeight: 18,
    marginBottom: 2,
  },
  otpSteps: {
    fontSize: 12,
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 12,
    lineHeight: 18,
  },
  warn: {
    fontSize: 12,
    color: '#B45309',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 12,
    lineHeight: 18,
  },
  forgotHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  btnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 8,
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
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
