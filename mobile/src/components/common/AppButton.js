import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

export default function AppButton({ label, onPress, variant = 'primary', loading = false, disabled = false, icon, fullWidth = false, size = 'md' }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[styles.base, styles[variant], styles[size], fullWidth && styles.fullWidth, isDisabled && styles.disabled]}>
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.primary} /> : icon}
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  outline: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  sm: { paddingVertical: 8, paddingHorizontal: 12 },
  md: { paddingVertical: 12, paddingHorizontal: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 20 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  primaryLabel: { color: COLORS.white },
  outlineLabel: { color: COLORS.primary },
  ghostLabel: { color: COLORS.primary },
});
