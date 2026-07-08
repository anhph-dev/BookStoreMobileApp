import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import AppButton from '../../components/common/AppButton';
import RatingStars from '../../components/product/RatingStars';
import { addItem } from '../../store/slices/cartSlice';
import { persistCartAfterMutation } from '../../services/cartSyncService';

export default function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const { productService } = useServices();
  const [quantity, setQuantity] = useState(1);

  const productId = route.params?.productId;
  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: Boolean(productId),
  });

  const product = productQuery.data;

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    const cartItem = {
      productId: product.ProductId || product.productId,
      productName: product.ProductName || product.productName,
      imageUrl: product.ImageUrl || product.imageUrl,
      price: Number(product.Price || product.price || 0),
      quantity,
    };

    dispatch(addItem(cartItem));
    await persistCartAfterMutation({ isGuestCart: cart.isGuestCart, userId: auth.user?.userId, items: [...cart.items, cartItem] });
    Toast.show({ type: 'success', text1: 'Đã thêm vào giỏ hàng' });
  };

  const maxQuantity = useMemo(() => Number(product?.Stock || product?.stock || 1), [product]);

  if (productQuery.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  if (!product) {
    return <View style={styles.center}><Text style={styles.empty}>Không tìm thấy sách.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.ImageUrl || product.imageUrl }} style={styles.image} />
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="chevron-back" size={20} color={COLORS.dark} /></Pressable>

      <View style={styles.body}>
        <Text style={styles.category}>{product.CategoryName || product.categoryName || 'Sách'}</Text>
        <Text style={styles.title}>{product.ProductName || product.productName}</Text>
        <Text style={styles.author}>Tác giả: {product.Author || product.author || 'Đang cập nhật'}</Text>
        <RatingStars rating={Number(product.AverageRating || product.averageRating || 0)} />
        <Text style={styles.price}>{Number(product.Price || product.price || 0).toLocaleString('vi-VN')} đ</Text>

        <View style={styles.quantityRow}>
          <Pressable onPress={() => setQuantity((current) => Math.max(1, current - 1))} style={styles.quantityButton}><Text style={styles.quantityButtonText}>-</Text></Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable onPress={() => setQuantity((current) => Math.min(maxQuantity, current + 1))} style={styles.quantityButton}><Text style={styles.quantityButtonText}>+</Text></Pressable>
        </View>

        <Text style={styles.sectionTitle}>Mô tả sách</Text>
        <Text style={styles.description}>{product.ShortDescription || product.shortDescription || product.Description || product.description || 'Đang cập nhật mô tả.'}</Text>
      </View>

      <View style={styles.footer}>
        <AppButton label={product.Stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'} onPress={handleAddToCart} disabled={Number(product.Stock || product.stock || 0) === 0} fullWidth />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  image: { width: '100%', height: 280, backgroundColor: COLORS.grayLight },
  backButton: { position: 'absolute', top: 48, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  body: { padding: 20, gap: 10 },
  category: { fontFamily: FONTS.medium, color: COLORS.primary },
  title: { fontFamily: FONTS.displayBold, fontSize: 22, color: COLORS.dark },
  author: { fontFamily: FONTS.regular, color: COLORS.gray },
  price: { fontFamily: FONTS.displayExtraBold, fontSize: 26, color: COLORS.primary },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  quantityButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.grayLight, alignItems: 'center', justifyContent: 'center' },
  quantityButtonText: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.dark },
  quantity: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.dark },
  sectionTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.dark, marginTop: 12 },
  description: { fontFamily: FONTS.regular, color: COLORS.gray, lineHeight: 22 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: FONTS.medium, color: COLORS.gray },
});
