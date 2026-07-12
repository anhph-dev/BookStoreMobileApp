import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SIZES } from '../../constants/theme';

export default function PickerField({
  label,
  value,
  placeholder,
  options = [],
  visible,
  onOpen,
  onClose,
  onSelect,
  getLabel = (item) => item?.label,
  disabled = false,
}) {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable onPress={onOpen} disabled={disabled} style={[styles.field, disabled && styles.disabled]}>
        <Text numberOfLines={1} style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.gray} />
      </Pressable>

      <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item, index) => `${label || 'picker'}-${item?.cityId ?? item?.wardId ?? 'item'}-${index}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={styles.optionText}>{getLabel(item)}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.dark, marginBottom: 6 },
  field: {
    minHeight: 50,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  disabled: { opacity: 0.55 },
  value: { flex: 1, fontFamily: FONTS.regular, color: COLORS.dark },
  placeholder: { color: COLORS.gray },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: { maxHeight: '70%', backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  handle: { width: 48, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.dark, marginBottom: 8 },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  optionText: { fontFamily: FONTS.medium, color: COLORS.dark },
});
