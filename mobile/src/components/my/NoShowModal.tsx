import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius } from '../../theme';

type Props = {
  visible: boolean;
  alias: string;
  reason: string;
  loading: boolean;
  onReason: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function NoShowModal({ visible, alias, reason, loading, onReason, onClose, onSubmit }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>노쇼 신고</Text>
          <Text style={styles.sub}>
            {alias} · 정당한 사유 없이 불참한 경우에만 신고해주세요.
          </Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={onReason}
            placeholder="신고 사유를 입력해주세요 (필수)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, !reason.trim() && styles.submitDisabled]}
              onPress={onSubmit}
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>신고하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  sub: { fontSize: 14, color: colors.textSecondary, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: colors.textSecondary },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontWeight: '700', color: '#fff' },
});
