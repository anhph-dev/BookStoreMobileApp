import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import AppButton from '../common/AppButton';

export default function CartItem({ item, onIncrease, onDecrease, onDelete }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item?.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.name}>{item?.productName}</Text>
        <Text style={styles.price}>{Number(item?.price || 0).toLocaleString('vi-VN')} đ</Text>
        <Text style={styles.subtotal}>x{item?.quantity || 1}</Text>
        <View style={styles.actions}>
          <AppButton label="-" onPress={onDecrease} variant="outline" size="sm" />
          <AppButton label="+" onPress={onIncrease} variant="outline" size="sm" />
          <AppButton label="Xóa" onPress={onDelete} variant="ghost" size="sm" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  image: { width: 80, height: 80, borderRadius: 8, backgroundColor: COLORS.grayLight },
  content: { flex: 1, gap: 4 },
  name: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.dark },
  price: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.primary },
  subtotal: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.gray },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
