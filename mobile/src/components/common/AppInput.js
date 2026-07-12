import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

export default function AppInput({ label, error, leftIcon, rightIcon, style, containerStyle, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.container, focused && styles.focused, error && styles.error, style]}>
        {leftIcon ? <Ionicons name={leftIcon} size={20} color={COLORS.gray} style={styles.icon} /> : null}
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.gray}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon ? (
          <Pressable onPress={props.onRightIconPress} hitSlop={8}>
            <Ionicons name={rightIcon} size={20} color={COLORS.gray} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  focused: { borderColor: COLORS.primary },
  error: { borderColor: COLORS.error },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    color: COLORS.dark,
    fontFamily: FONTS.regular,
    fontSize: 14,
    paddingVertical: 0,
  },
  errorText: {
    color: COLORS.error,
    marginTop: 6,
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
});
