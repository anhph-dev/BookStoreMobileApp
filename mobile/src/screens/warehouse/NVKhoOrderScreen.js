import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import OrderStatusBadge from '../../components/order/OrderStatusBadge';

const tabs = [['Confirmed', 'Đã xác nhận'], ['Shipping', 'Đang giao'], ['Shipped', 'Đã giao']];
export default function NVKhoOrderScreen() {
  const [status, setStatus] = useState('Confirmed'); const { adminService } = useServices(); const qc = useQueryClient();
  const query = useQuery({ queryKey: ['nvkho-orders', status], queryFn: () => adminService.getOrders({ status, limit: 100 }) });
  const mutation = useMutation({ mutationFn: ({ id, next }) => adminService.updateOrderStatus(id, next), onSuccess: () => qc.invalidateQueries({ queryKey: ['nvkho-orders'] }) });
  return <View style={styles.container}><Text style={styles.title}>Đơn hàng cần xử lý</Text><View style={styles.tabs}>{tabs.map(([key, label]) => <Pressable key={key} onPress={() => setStatus(key)} style={[styles.tab, status === key && styles.active]}><Text style={[styles.tabText, status === key && styles.activeText]}>{label}</Text></Pressable>)}</View>
    <FlatList data={query.data?.orders || []} keyExtractor={(x) => String(x.OrderId)} contentContainerStyle={styles.list} refreshing={query.isFetching} onRefresh={query.refetch}
      renderItem={({ item }) => { const next = item.Status === 'Confirmed' ? 'Shipping' : item.Status === 'Shipping' ? 'Shipped' : null; return <View style={styles.card}>
        <View style={styles.row}><Text style={styles.id}>#{item.OrderId}</Text><OrderStatusBadge status={item.Status} /></View><Text style={styles.meta}>{formatDateTime(item.OrderDate)}</Text>
        <Text style={styles.name}>{item.RecipientName} · {item.PhoneNumber}</Text><Text style={styles.meta}>{[item.ShippingAddress, item.WardName, item.CityName].filter(Boolean).join(', ')}</Text>
        {(item.items || []).map((x) => <Text key={x.ProductId} style={styles.item}>• {x.ProductName} × {x.Quantity}</Text>)}<Text style={styles.money}>{formatCurrency(item.TotalAmount)} đ</Text>
        {next && <Pressable style={styles.button} onPress={() => Alert.alert('Cập nhật trạng thái?', '', [{ text: 'Hủy' }, { text: 'Xác nhận', onPress: () => mutation.mutate({ id: item.OrderId, next }) }])}><Text style={styles.buttonText}>{next === 'Shipping' ? 'Bắt đầu giao' : 'Đã giao xong'}</Text></Pressable>}</View>; }} />
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight }, title: { fontFamily: FONTS.displayExtraBold, fontSize: 22, color: COLORS.dark, padding: 16 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 7 }, tab: { flex: 1, alignItems: 'center', padding: 9, backgroundColor: COLORS.white, borderRadius: 10 }, active: { backgroundColor: COLORS.primary },
  tabText: { fontFamily: FONTS.medium, color: COLORS.gray, fontSize: 12 }, activeText: { color: COLORS.white }, list: { padding: 16, gap: 10 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, gap: 5, ...SHADOWS.sm }, row: { flexDirection: 'row', justifyContent: 'space-between' }, id: { fontFamily: FONTS.bold, color: COLORS.dark },
  meta: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12 }, name: { fontFamily: FONTS.semiBold, color: COLORS.dark }, item: { fontFamily: FONTS.regular, color: COLORS.dark, fontSize: 12 },
  money: { textAlign: 'right', fontFamily: FONTS.bold, color: COLORS.primary }, button: { backgroundColor: COLORS.primary, borderRadius: 9, padding: 10, alignItems: 'center', marginTop: 5 }, buttonText: { color: COLORS.white, fontFamily: FONTS.semiBold },
});
