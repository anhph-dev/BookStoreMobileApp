import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import ProductCard from '../../components/product/ProductCard';
import EmptyState from '../../components/common/EmptyState';
import { addItem } from '../../store/slices/cartSlice';
import { persistCartAfterMutation } from '../../services/cartSyncService';
import { buildCartItem, getNextCartItems } from '../../utils/cartItems';

const DEFAULT_FILTERS = {
  search: '',
  categoryId: null,
  minPrice: null,
  maxPrice: null,
  isFeatured: null,
  isNewArrival: null,
  isBestSeller: null,
  page: 1,
};

const PRICE_RANGES = [
  { key: 'under100', label: 'Dưới 100.000 đ', minPrice: null, maxPrice: 100000 },
  { key: '100to250', label: '100.000 - 250.000 đ', minPrice: 100000, maxPrice: 250000 },
  { key: 'over250', label: 'Trên 250.000 đ', minPrice: 250000, maxPrice: null },
];

const getRouteFilters = (params = {}) => ({
  ...DEFAULT_FILTERS,
  categoryId: params.categoryId ?? null,
  minPrice: params.minPrice ?? null,
  maxPrice: params.maxPrice ?? null,
  isFeatured: params.isFeatured ?? null,
  isNewArrival: params.isNewArrival ?? null,
  isBestSeller: params.isBestSeller ?? null,
});

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  const { productService } = useServices();
  const [filters, setFilters] = useState(getRouteFilters(route.params));
  const [input, setInput] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => productService.getCategories() });

  useEffect(() => {
    setFilters((current) => ({ ...getRouteFilters(route.params), search: current.search }));
  }, [route.params]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => ({ ...current, search: input, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [input]);

  const productsQuery = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
    keepPreviousData: true,
  });

  const filterChips = useMemo(() => [
    { key: 'all', label: 'Tất cả' },
    { key: 'category', label: 'Danh mục' },
    { key: 'price', label: 'Giá' },
    { key: 'bestSeller', label: 'Bán chạy' },
    { key: 'newArrival', label: 'Sách mới' },
    { key: 'featured', label: 'Nổi bật' },
  ], []);

  const activeProducts = productsQuery.data?.products || [];
  const activeChipKey = filters.categoryId ? 'category'
    : filters.minPrice || filters.maxPrice ? 'price'
      : filters.isBestSeller ? 'bestSeller'
        : filters.isNewArrival ? 'newArrival'
          : filters.isFeatured ? 'featured'
            : 'all';

  const applyCleanFilters = (nextFilters = {}) => {
    // Mỗi chip là một preset, nên chọn chip mới sẽ xóa preset cũ.
    setFilters({ ...DEFAULT_FILTERS, search: input, ...nextFilters, page: 1 });
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.circleButton}><Ionicons name="chevron-back" size={20} color={COLORS.dark} /></Pressable>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.gray} />
          <TextInput value={input} onChangeText={setInput} placeholder="Tìm sách, tác giả..." style={styles.searchInput} autoFocus />
        </View>
        <Pressable onPress={() => setInput('')} style={styles.circleButton}><Ionicons name="close" size={18} color={COLORS.dark} /></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroller} contentContainerStyle={styles.filterRow}>
        {filterChips.map((chip) => (
          <Pressable key={chip.key} onPress={() => {
            if (chip.key === 'all') {
              applyCleanFilters();
              return;
            }
            if (chip.key === 'category') {
              setCategoryModalVisible(true);
              return;
            }
            if (chip.key === 'price') {
              setPriceModalVisible(true);
              return;
            }
            applyCleanFilters({
              isBestSeller: chip.key === 'bestSeller' ? true : null,
              isNewArrival: chip.key === 'newArrival' ? true : null,
              isFeatured: chip.key === 'featured' ? true : null,
            });
          }} style={[styles.filterChip, activeChipKey === chip.key && styles.filterChipActive]}>
            <Text style={[styles.filterLabel, activeChipKey === chip.key && styles.filterLabelActive]} numberOfLines={1}>{chip.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {productsQuery.isLoading ? <Text style={styles.loading}>Đang tải...</Text> : null}

      <FlatList
        data={activeProducts}
        keyExtractor={(item) => String(item.productId)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
              onAdd={() => handleAddToCart(item)}
            />
          </View>
        )}
        ListEmptyComponent={!productsQuery.isLoading ? <EmptyState title="Không tìm thấy sách phù hợp" subtitle="Hãy thử từ khóa khác." /> : null}
        contentContainerStyle={styles.list}
      />

      <Modal transparent visible={categoryModalVisible} animationType="fade" onRequestClose={() => setCategoryModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn danh mục</Text>
            {(categoriesQuery.data || []).map((category) => (
              <Pressable
                key={category.categoryId}
                onPress={() => {
                  applyCleanFilters({ categoryId: category.categoryId });
                  setCategoryModalVisible(false);
                }}
                style={styles.modalItem}
              >
                <Text style={styles.modalItemText}>{category.categoryName}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={priceModalVisible} animationType="fade" onRequestClose={() => setPriceModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPriceModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn khoảng giá</Text>
            {PRICE_RANGES.map((range) => (
              <Pressable
                key={range.key}
                onPress={() => {
                  applyCleanFilters({ minPrice: range.minPrice, maxPrice: range.maxPrice });
                  setPriceModalVisible(false);
                }}
                style={styles.modalItem}
              >
                <Text style={styles.modalItemText}>{range.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.grayLight, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.grayLight, borderRadius: SIZES.radiusFull, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: FONTS.regular },
  filterScroller: { height: 58, flexGrow: 0 },
  filterRow: { gap: 8, paddingVertical: 10, paddingRight: 16, alignItems: 'center' },
  // Keep horizontal filter chips from stretching vertically on Android.
  filterChip: { height: 38, backgroundColor: COLORS.grayLight, paddingHorizontal: 14, borderRadius: SIZES.radiusFull, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterLabel: { fontFamily: FONTS.medium, fontSize: 14, lineHeight: 18, color: COLORS.gray },
  filterLabelActive: { color: COLORS.white },
  list: { paddingBottom: 24 },
  gridRow: { gap: 12 },
  gridItem: { flex: 1, marginBottom: 12 },
  loading: { color: COLORS.gray, fontFamily: FONTS.regular },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' },
  modalCard: { backgroundColor: COLORS.white, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%' },
  modalTitle: { fontFamily: FONTS.displayBold, fontSize: 18, marginBottom: 10, color: COLORS.dark },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalItemText: { fontFamily: FONTS.medium, color: COLORS.dark },
});
