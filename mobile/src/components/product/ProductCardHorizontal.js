import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import RatingStars from './RatingStars';
import AppButton from '../common/AppButton';

export default function ProductCardHorizontal({ product, onPress, onAdd }) {
  const meta = [product?.format, product?.language].filter(Boolean).join(' · ');

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={{ uri: product?.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.name}>{product?.productName}</Text>
        <Text numberOfLines={1} style={styles.author}>{product?.author}</Text>
        {meta ? <Text numberOfLines={1} style={styles.meta}>{meta}</Text> : null}
        <View style={styles.row}>
          <RatingStars rating={product?.averageRating || 0} size={12} />
          <Text style={styles.reviewCount}>({product?.reviewCount || 0})</Text>
        </View>
        <Text style={styles.price}>{Number(product?.price || 0).toLocaleString('vi-VN')} đ</Text>
        <View style={styles.action}>
          <AppButton label="Thêm" onPress={(event) => {
            event?.stopPropagation?.();
            onAdd?.();
          }} size="sm" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginRight: 12,
    width: 260,
    ...SHADOWS.sm,
  },
  image: { width: 96, height: 156, backgroundColor: COLORS.grayLight },
  content: { flex: 1, padding: 12, gap: 5 },
  name: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.dark },
  author: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray },
  meta: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.gray },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewCount: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.gray },
  price: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.primary },
  action: { alignSelf: 'flex-start' },
});
