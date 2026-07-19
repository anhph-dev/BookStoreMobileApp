import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import PickerField from '../../components/common/PickerField';

const filters = [['all', 'Tất cả'], ['low', 'Sắp hết'], ['out', 'Hết hàng']];
export default function InventoryScreen() {
  const navigation = useNavigation(); const { warehouseService, productService } = useServices();
  const [stockStatus, setStockStatus] = useState('all'); const [categoryId, setCategoryId] = useState(null); const [search, setSearch] = useState(''); const [picker, setPicker] = useState(false);
  const query = useQuery({ queryKey: ['inventory', stockStatus, categoryId, search], queryFn: () => warehouseService.getInventory({ stockStatus, categoryId, search }) });
  const categories = useQuery({ queryKey: ['categories'], queryFn: productService.getCategories }); const data = query.data || {};
  return <View style={styles.container}><Text style={styles.title}>Báo cáo tồn kho</Text><View style={styles.summary}><Summary value={data.total} label="Tổng sản phẩm" color={COLORS.info} /><Summary value={data.lowStockCount} label="Sắp hết" color={COLORS.warning} /><Summary value={data.outOfStockCount} label="Hết hàng" color={COLORS.error} /></View>
    <TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Tìm sản phẩm..." /><View style={styles.tabs}>{filters.map(([key, label]) => <Pressable key={key} onPress={() => setStockStatus(key)} style={[styles.tab, stockStatus === key && styles.active]}><Text style={stockStatus === key && styles.activeText}>{label}</Text></Pressable>)}</View>
    <View style={styles.picker}><PickerField label="Danh mục" value={categories.data?.find((x) => x.categoryId === categoryId)?.categoryName || 'Tất cả danh mục'} options={[{ categoryId: null, categoryName: 'Tất cả danh mục' }, ...(categories.data || [])]} visible={picker} onOpen={() => setPicker(true)} onClose={() => setPicker(false)} onSelect={(x) => setCategoryId(x.categoryId)} getLabel={(x) => x.categoryName} /></View>
    <FlatList data={data.products || []} keyExtractor={(x) => String(x.ProductId)} contentContainerStyle={styles.list} refreshing={query.isFetching} onRefresh={query.refetch}
      renderItem={({ item }) => { const color = item.Stock === 0 ? COLORS.error : item.Stock < 10 ? COLORS.warning : COLORS.success; return <Pressable style={styles.card} onPress={() => navigation.navigate('ProductForm', { productId: item.ProductId })}>
        <View style={styles.main}><Text style={styles.name}>{item.ProductName}</Text><Text style={styles.meta}>{item.CategoryName} · Đã bán {item.SoldCount || 0}</Text></View><Text style={[styles.badge, { backgroundColor: color }]}>{item.Stock === 0 ? 'Hết hàng' : `Còn ${item.Stock}`}</Text></Pressable>; }} />
  </View>;
}
function Summary({ value, label, color }) { return <View style={[styles.summaryCard, { borderTopColor: color }]}><Text style={[styles.count, { color }]}>{value || 0}</Text><Text style={styles.summaryLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight }, title: { fontFamily: FONTS.displayExtraBold, fontSize: 22, color: COLORS.dark, padding: 16 },
  summary: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 }, summaryCard: { flex: 1, backgroundColor: COLORS.white, padding: 10, alignItems: 'center', borderRadius: 12, borderTopWidth: 4, ...SHADOWS.sm },
  count: { fontFamily: FONTS.displayExtraBold, fontSize: 20 }, summaryLabel: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 10 }, search: { margin: 14, marginBottom: 8, height: 44, backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 12 },
  tabs: { flexDirection: 'row', gap: 7, paddingHorizontal: 16 }, tab: { flex: 1, alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 9, padding: 8 }, active: { backgroundColor: COLORS.primary }, activeText: { color: COLORS.white },
  picker: { padding: 16, paddingBottom: 0 }, list: { padding: 16, gap: 9 }, card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', ...SHADOWS.sm },
  main: { flex: 1 }, name: { fontFamily: FONTS.semiBold, color: COLORS.dark }, meta: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 11, marginTop: 3 },
  badge: { color: COLORS.white, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontFamily: FONTS.semiBold, fontSize: 11 },
});
