import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import RatingStars from './RatingStars';
import AppButton from '../common/AppButton';

export default function ProductCard({ product, onPress, onAdd }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={{ uri: product?.imageUrl }} style={styles.image} resizeMode="cover" />
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>{product?.productName}</Text>
        <Text numberOfLines={1} style={styles.author}>{product?.author}</Text>
        <View style={styles.ratingRow}>
          <RatingStars rating={product?.averageRating || 0} size={12} />
          <Text style={styles.reviewCount}>({product?.reviewCount || 0})</Text>
        </View>
        <Text style={styles.price}>{Number(product?.price || 0).toLocaleString('vi-VN')} đ</Text>
        <AppButton label="Thêm" onPress={onAdd} size="sm" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginRight: 12,
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.grayLight,
  },
  body: {
    padding: 10,
    gap: 6,
  },
  name: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.dark,
  },
  author: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.gray,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewCount: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.gray,
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
  },
});
