import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { firstName } from '../../utils/formatters';
import ProductCardHorizontal from '../../components/product/ProductCardHorizontal';
import EmptyState from '../../components/common/EmptyState';
import { addItem } from '../../store/slices/cartSlice';
import { persistCartAfterMutation } from '../../services/cartSyncService';
import { buildCartItem, getNextCartItems } from '../../utils/cartItems';

export default function HomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { productService } = useServices();
  const auth = useSelector((state) => state.auth);
  const user = auth.user;
  const cart = useSelector((state) => state.cart);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  const featuredQuery = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getProducts({ isFeatured: true, limit: 6 }),
  });

  const newArrivalQuery = useQuery({
    queryKey: ['products', 'newArrival'],
    queryFn: () => productService.getProducts({ isNewArrival: true, limit: 6 }),
  });

  const bestSellerQuery = useQuery({
    queryKey: ['products', 'bestSeller'],
    queryFn: () => productService.getProducts({ isBestSeller: true, limit: 6 }),
  });

  const categories = categoriesQuery.data || [];

  const handleAddToCart = async (product) => {
    const cartItem = buildCartItem(product);

    try {
      dispatch(addItem(cartItem));
      const nextItems = getNextCartItems(cart.items, cartItem);
      await persistCartAfterMutation({ isGuestCart: cart.isGuestCart, userId: auth.user?.userId, items: nextItems });
      Toast.show({ type: 'success', text1: 'Đã thêm vào giỏ hàng' });
    } catch (error) {
      console.warn('Add to cart failed', error);
      Toast.show({ type: 'error', text1: 'Không thể thêm vào giỏ hàng' });
    }
  };

  const renderSection = (title, query, seeAllFilter = {}) => {
    const items = query.data?.products || query.data || [];
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Pressable onPress={() => navigation.navigate('Search', seeAllFilter)}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </Pressable>
        </View>
        {query.isLoading ? (
          <Text style={styles.loadingText}>Đang tải...</Text>
        ) : items.length === 0 ? (
          <EmptyState title="Chưa có dữ liệu" subtitle="Vui lòng thử lại sau." />
        ) : (
          <FlatList
            data={items}
            horizontal
            keyExtractor={(item) => String(item.productId)}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <ProductCardHorizontal
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
                onAdd={() => handleAddToCart(item)}
              />
            )}
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>BookStore</Text>
          {user ? <Text style={styles.greeting}>Xin chào, {firstName(user.fullName)}!</Text> : <Text style={styles.greeting}>Khám phá đầu sách mới hôm nay.</Text>}
        </View>
        <Pressable onPress={() => navigation.navigate('CartTab')} style={styles.iconButton}>
          <Ionicons name="cart-outline" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <Pressable onPress={() => navigation.navigate('Search')} style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray} />
        <Text style={styles.searchPlaceholder}>Tìm kiếm sách, tác giả...</Text>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerRow}>
        {['Sách mới tháng này', 'Giảm đến 30%', 'Bán chạy nhất'].map((text) => (
          <View key={text} style={styles.banner}>
            <Text style={styles.bannerText}>{text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danh mục</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map((category) => (
            <Pressable
              key={category.categoryId ?? category.CategoryId}
              style={styles.chip}
              onPress={() => navigation.navigate('Search', {
                categoryId: category.categoryId ?? category.CategoryId,
              })}
            >
              <Text style={styles.chipLabel}>{category.categoryName ?? category.CategoryName}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {renderSection('Sách nổi bật', featuredQuery, { isFeatured: true })}
      {renderSection('Sách mới', newArrivalQuery, { isNewArrival: true })}
      {renderSection('Bán chạy', bestSellerQuery, { isBestSeller: true })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 16, paddingBottom: 32, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontFamily: FONTS.displayExtraBold, fontSize: 22, color: COLORS.primary },
  greeting: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, marginTop: 4 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.grayLight, borderRadius: SIZES.radiusFull, paddingHorizontal: 16, paddingVertical: 14 },
  searchPlaceholder: { fontFamily: FONTS.regular, color: COLORS.gray },
  bannerRow: { marginTop: 2 },
  banner: { width: 220, height: 96, marginRight: 12, borderRadius: 16, backgroundColor: COLORS.primary, padding: 16, justifyContent: 'flex-end' },
  bannerText: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.white },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.dark },
  seeAll: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.primary },
  loadingText: { fontFamily: FONTS.regular, color: COLORS.gray },
  chipRow: { gap: 8 },
  chip: { backgroundColor: COLORS.grayLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: SIZES.radiusFull },
  chipLabel: { fontFamily: FONTS.medium, color: COLORS.gray },
});
