import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatKST, toSlotStartMs } from '../lib/slots';
import { colors, radius } from '../theme';

type Props = {
  valueMs: number;
  onChange: (ms: number) => void;
};

/** 다음 N개의 10분 슬롯 칩 */
export function SlotStrip({ valueMs, onChange }: Props) {
  const base = toSlotStartMs(Date.now());
  const slots = Array.from({ length: 18 }, (_, i) => base + i * 10 * 60 * 1000);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>시간 선택</Text>
      <FlatList
        horizontal
        data={slots}
        keyExtractor={(item) => String(item)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const selected = toSlotStartMs(valueMs) === item;
          return (
            <Pressable
              style={[styles.chip, selected && styles.chipOn]}
              onPress={() => onChange(item)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{formatKST(item)}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  list: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFAFA',
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: '#E8F0FF',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextOn: { color: colors.primary },
});
