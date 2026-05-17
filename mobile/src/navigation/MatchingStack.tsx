import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { MatchingScreen } from '../screens/MatchingScreen';
import { PartyDetailScreen } from '../screens/PartyDetailScreen';
import type { MatchingStackParamList } from './types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<MatchingStackParamList>();

export function MatchingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="MatchingList" component={MatchingScreen} options={{ title: '매칭' }} />
      <Stack.Screen name="PartyDetail" component={PartyDetailScreen} options={{ title: '파티 상세' }} />
    </Stack.Navigator>
  );
}
