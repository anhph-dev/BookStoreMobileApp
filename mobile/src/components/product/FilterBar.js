import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

export default function FilterBar({ filters = [], activeKey, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroller} contentContainerStyle={styles.container}>
      {filters.map((filter) => {
        const active = filter.key === activeKey;
        return (
          <Pressable key={filter.key} onPress={() => onChange?.(filter.key)} style={[styles.chip, active && styles.activeChip]}>
            <Text style={[styles.label, active && styles.activeLabel]} numberOfLines={1}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { height: 54, flexGrow: 0 },
  container: { gap: 8, paddingVertical: 8, alignItems: 'center' },
  // Cố định chiều cao để chip filter không bị kéo dọc trên Android.
  chip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  activeChip: { backgroundColor: COLORS.primary },
  label: { fontFamily: FONTS.medium, fontSize: 13, lineHeight: 17, color: COLORS.gray },
  activeLabel: { color: COLORS.white },
});
