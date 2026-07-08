import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

export default function FilterBar({ filters = [], activeKey, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {filters.map((filter) => {
        const active = filter.key === activeKey;
        return (
          <Pressable key={filter.key} onPress={() => onChange?.(filter.key)} style={[styles.chip, active && styles.activeChip]}>
            <Text style={[styles.label, active && styles.activeLabel]}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.grayLight,
  },
  activeChip: { backgroundColor: COLORS.primary },
  label: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.gray },
  activeLabel: { color: COLORS.white },
});
