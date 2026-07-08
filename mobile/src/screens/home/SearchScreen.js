import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import ProductCard from '../../components/product/ProductCard';
import EmptyState from '../../components/common/EmptyState';

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

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { productService } = useServices();
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, categoryId: route.params?.categoryId || null });
  const [input, setInput] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: () => productService.getCategories() });

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
    { key: 'category', label: 'Danh mục' },
    { key: 'price', label: 'Giá' },
    { key: 'bestSeller', label: 'Bán chạy' },
    { key: 'newArrival', label: 'Sách mới' },
    { key: 'featured', label: 'Nổi bật' },
  ], []);

  const activeProducts = productsQuery.data?.products || [];

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filterChips.map((chip) => (
          <Pressable key={chip.key} onPress={() => {
            if (chip.key === 'category') {
              setCategoryModalVisible(true);
              return;
            }
            setFilters((current) => ({ ...current, [chip.key === 'bestSeller' ? 'isBestSeller' : chip.key === 'newArrival' ? 'isNewArrival' : 'isFeatured']: true, page: 1 }));
          }} style={styles.filterChip}>
            <Text style={styles.filterLabel}>{chip.label}</Text>
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
            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })} />
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
                key={category.CategoryId}
                onPress={() => {
                  setFilters((current) => ({ ...current, categoryId: category.CategoryId, page: 1 }));
                  setCategoryModalVisible(false);
                }}
                style={styles.modalItem}
              >
                <Text style={styles.modalItemText}>{category.CategoryName}</Text>
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
  filterRow: { gap: 8, paddingVertical: 12 },
  filterChip: { backgroundColor: COLORS.grayLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: SIZES.radiusFull },
  filterLabel: { fontFamily: FONTS.medium, color: COLORS.gray },
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
