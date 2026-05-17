import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../context/AppContext';
import type { MainTabParamList } from '../navigation/types';
import { colors, radius } from '../theme';

type Nav = BottomTabNavigationProp<MainTabParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { userEmail, socketConnected } = useApp();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.inner}>
        <Text style={styles.greeting}>안녕하세요</Text>
        <Text style={styles.name} numberOfLines={1}>
          {userEmail ?? '연세인'}
        </Text>
        <Text style={styles.sub}>
          {socketConnected ? '실시간 매칭에 연결되었습니다.' : '연결 중…'}
        </Text>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="car-sport-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>같이 타면 부담은 줄고</Text>
          <Text style={styles.heroTitle}>이동은 편해져요</Text>
          <Text style={styles.heroDesc}>시간대를 고르고, 합승 파티를 찾거나 만들어 보세요.</Text>
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Matching')}
        >
          <Text style={styles.ctaText}>파티 매칭하러 가기</Text>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.linkText}>내 정보 · 설정</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  greeting: { fontSize: 15, color: colors.textSecondary },
  name: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 },
  sub: { fontSize: 14, color: colors.muted, marginTop: 6, marginBottom: 28 },
  hero: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  heroDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  cta: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  link: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  linkText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
});
