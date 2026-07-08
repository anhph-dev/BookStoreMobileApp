import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const palette = {
  success: { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: COLORS.success },
  warning: { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: COLORS.warning },
  error: { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: COLORS.error },
  info: { backgroundColor: 'rgba(59, 130, 246, 0.12)', color: COLORS.info },
  default: { backgroundColor: COLORS.grayLight, color: COLORS.gray },
};

export default function AppBadge({ label, color = 'default', style }) {
  const selected = palette[color] || palette.default;
  return (
    <View style={[styles.badge, { backgroundColor: selected.backgroundColor }, style]}>
      <Text style={[styles.text, { color: selected.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
});
