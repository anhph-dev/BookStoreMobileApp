import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import AppButton from '../../components/common/AppButton';
import EmptyState from '../../components/common/EmptyState';

export default function ProductManageScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { productService } = useServices();
  const [search, setSearch] = useState('');

  const productsQuery = useQuery({ queryKey: ['admin-products'], queryFn: () => productService.getProducts({ limit: 100 }) });

  const deleteMutation = useMutation({
    mutationFn: (id) => productService.deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const products = (productsQuery.data?.products || []).filter((item) => String(item.ProductName || item.productName || '').toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (id) => {
    Alert.alert('Xóa sản phẩm', 'Xóa sản phẩm này?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý sản phẩm</Text>
      <TextInput value={search} onChangeText={setSearch} placeholder="Tìm theo tên sách..." style={styles.search} />
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.ProductId || item.productId)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.ProductName || item.productName}</Text>
              <View style={styles.actions}>
                <Pressable onPress={() => navigation.navigate('ProductForm', { productId: item.ProductId || item.productId })}><Ionicons name="pencil" size={18} color={COLORS.primary} /></Pressable>
                <Pressable onPress={() => handleDelete(item.ProductId || item.productId)}><Ionicons name="trash" size={18} color={COLORS.error} /></Pressable>
              </View>
            </View>
            <Text style={styles.author}>{item.Author || item.author}</Text>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Không có sản phẩm" subtitle="Thêm sản phẩm mới bằng nút bên dưới." />}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
      />
      <Pressable onPress={() => navigation.navigate('ProductForm')} style={styles.fab}><Ionicons name="add" size={28} color={COLORS.white} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.dark, padding: 16, paddingBottom: 0 },
  search: { margin: 16, marginBottom: 0, padding: 12, borderRadius: SIZES.radius, backgroundColor: COLORS.grayLight, fontFamily: FONTS.regular },
  card: { backgroundColor: COLORS.white, padding: 16, borderRadius: SIZES.radius, ...SHADOWS.sm, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: FONTS.displayBold, color: COLORS.dark, flex: 1, paddingRight: 12 },
  author: { fontFamily: FONTS.regular, color: COLORS.gray },
  actions: { flexDirection: 'row', gap: 14 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
});
