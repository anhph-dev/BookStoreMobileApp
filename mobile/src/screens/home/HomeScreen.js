import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { firstName } from '../../utils/formatters';
import ProductCard from '../../components/product/ProductCard';
import ProductCardHorizontal from '../../components/product/ProductCardHorizontal';
import EmptyState from '../../components/common/EmptyState';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { productService } = useServices();
  const user = useSelector((state) => state.auth.user);

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

  const renderSection = (title, query, horizontal = true) => {
    const items = query.data?.products || query.data || [];
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {query.isLoading ? (
          <Text style={styles.loadingText}>Đang tải...</Text>
        ) : items.length === 0 ? (
          <EmptyState title="Chưa có dữ liệu" subtitle="Vui lòng thử lại sau." />
        ) : horizontal ? (
          <FlatList
            data={items}
            horizontal
            keyExtractor={(item) => String(item.productId)}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <ProductCardHorizontal
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
              />
            )}
          />
        ) : null}
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
            <Pressable key={category.CategoryId} style={styles.chip} onPress={() => navigation.navigate('Search', { categoryId: category.CategoryId })}>
              <Text style={styles.chipLabel}>{category.CategoryName}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {renderSection('Sách nổi bật', featuredQuery)}
      {renderSection('Sách mới', newArrivalQuery)}
      {renderSection('Bán chạy', bestSellerQuery)}
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
  loadingText: { fontFamily: FONTS.regular, color: COLORS.gray },
  chipRow: { gap: 8 },
  chip: { backgroundColor: COLORS.grayLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: SIZES.radiusFull },
  chipLabel: { fontFamily: FONTS.medium, color: COLORS.gray },
});
