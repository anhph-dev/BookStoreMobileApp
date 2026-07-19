import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { firstName, formatCurrency, formatDateTime } from '../../utils/formatters';
import OrderStatusBadge from '../../components/order/OrderStatusBadge';

const filters = [['', 'Tất cả'], ['Pending', 'Chờ xử lý'], ['Confirmed', 'Đã xác nhận']];
export default function SaleOrderListScreen() {
  const [status, setStatus] = useState(''); const navigation = useNavigation(); const qc = useQueryClient();
  const user = useSelector((s) => s.auth.user); const { adminService } = useServices();
  const query = useInfiniteQuery({ queryKey: ['sale-orders', status], initialPageParam: 1,
    queryFn: ({ pageParam }) => adminService.getOrders({ status: status || undefined, page: pageParam, limit: 15 }),
    getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined });
  const mutation = useMutation({ mutationFn: (id) => adminService.updateOrderStatus(id, 'Confirmed'), onSuccess: () => qc.invalidateQueries({ queryKey: ['sale-orders'] }) });
  const orders = query.data?.pages.flatMap((x) => x.orders) || [];
  return <View style={styles.container}><Text style={styles.title}>Đơn hàng - Sale</Text><Text style={styles.sub}>Xin chào, {firstName(user?.fullName)}</Text>
    <View style={styles.tabs}>{filters.map(([key, label]) => <Pressable key={key} onPress={() => setStatus(key)} style={[styles.tab, status === key && styles.active]}><Text style={[styles.tabText, status === key && styles.activeText]}>{label}</Text></Pressable>)}</View>
    <FlatList data={orders} keyExtractor={(x) => String(x.OrderId)} contentContainerStyle={styles.list} onEndReached={query.fetchNextPage}
      renderItem={({ item }) => <View style={styles.card}><View style={styles.row}><Text style={styles.id}>#{item.OrderId}</Text><OrderStatusBadge status={item.Status} /></View>
        <Text style={styles.sub}>{formatDateTime(item.OrderDate)}</Text><Text style={styles.name}>{item.RecipientName}</Text><Text style={styles.money}>{formatCurrency(item.TotalAmount)} đ</Text>
        {item.Status === 'Pending' && <Pressable style={styles.confirm} onPress={() => Alert.alert(`Xác nhận đơn #${item.OrderId}?`, '', [{ text: 'Hủy' }, { text: 'Xác nhận', onPress: () => mutation.mutate(item.OrderId) }])}><Text style={styles.confirmText}>Xác nhận</Text></Pressable>}</View>} />
    <Pressable style={styles.fab} onPress={() => navigation.navigate('SaleCreateOrder')}><Ionicons name="add" size={22} color={COLORS.white} /><Text style={styles.fabText}>Tạo đơn mới</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight }, title: { fontFamily: FONTS.displayExtraBold, fontSize: 22, color: COLORS.dark, padding: 16, paddingBottom: 0 }, sub: { color: COLORS.gray, fontFamily: FONTS.regular, paddingHorizontal: 16, marginTop: 4 },
  tabs: { flexDirection: 'row', gap: 6, padding: 16 }, tab: { paddingHorizontal: 13, paddingVertical: 8, backgroundColor: COLORS.white, borderRadius: 18 }, active: { backgroundColor: COLORS.primary }, tabText: { color: COLORS.gray, fontFamily: FONTS.medium }, activeText: { color: COLORS.white },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 90 }, card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, gap: 5, ...SHADOWS.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' }, id: { fontFamily: FONTS.bold, color: COLORS.dark }, name: { fontFamily: FONTS.semiBold, color: COLORS.dark, paddingHorizontal: 16 },
  money: { fontFamily: FONTS.bold, color: COLORS.primary, paddingHorizontal: 16 }, confirm: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, borderWidth: 1, borderColor: COLORS.primary },
  confirmText: { color: COLORS.primary, fontFamily: FONTS.semiBold }, fab: { position: 'absolute', right: 18, bottom: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 16, height: 52, borderRadius: 26, ...SHADOWS.md },
  fabText: { color: COLORS.white, fontFamily: FONTS.bold },
});
