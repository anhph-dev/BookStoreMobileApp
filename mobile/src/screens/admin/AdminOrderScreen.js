import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import OrderStatusBadge from '../../components/order/OrderStatusBadge';
export default function AdminOrderScreen() {
  const [search, setSearch] = useState(''); const { adminService } = useServices();
  const query = useQuery({ queryKey: ['admin-orders', search], queryFn: () => adminService.getOrders({ search, limit: 100 }) });
  return <View style={styles.container}><Text style={styles.title}>Quản lý đơn hàng</Text><TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Tên người nhận / SĐT" />
    <FlatList data={query.data?.orders || []} keyExtractor={(x) => String(x.OrderId)} contentContainerStyle={styles.list} renderItem={({ item }) => <View style={styles.card}>
      <View style={styles.row}><Text style={styles.id}>#{item.OrderId}</Text><OrderStatusBadge status={item.Status} /></View><Text style={styles.meta}>{formatDateTime(item.OrderDate)} · {item.Channel}</Text><Text style={styles.name}>{item.RecipientName} · {item.PhoneNumber}</Text><Text style={styles.money}>{formatCurrency(item.TotalAmount)} đ</Text></View>} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.grayLight }, title: { fontFamily: FONTS.displayExtraBold, fontSize: 22, padding: 16 }, search: { marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 10, padding: 12 }, list: { padding: 16, gap: 10 }, card: { backgroundColor: COLORS.white, borderRadius: 13, padding: 14, gap: 5, ...SHADOWS.sm }, row: { flexDirection: 'row', justifyContent: 'space-between' }, id: { fontFamily: FONTS.bold }, meta: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12 }, name: { fontFamily: FONTS.semiBold }, money: { fontFamily: FONTS.bold, color: COLORS.primary } });
