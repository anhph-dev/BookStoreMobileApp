import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import OrderStatusBadge from '../../components/order/OrderStatusBadge';

const tabs = [['Confirmed', 'Đã xác nhận'], ['Shipping', 'Đang giao'], ['Shipped', 'Đã giao']];

export default function NVKhoOrderScreen() {
  const [status, setStatus] = useState('Confirmed');
  const navigation = useNavigation();
  const { adminService } = useServices();
  const query = useQuery({
    queryKey: ['nvkho-orders', status],
    queryFn: () => adminService.getOrders({ status, limit: 100 }),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đơn hàng cần xử lý</Text>
      <View style={styles.tabs}>
        {tabs.map(([key, label]) => (
          <Pressable key={key} onPress={() => setStatus(key)} style={[styles.tab, status === key && styles.active]}>
            <Text style={[styles.tabText, status === key && styles.activeText]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={query.data?.orders || []}
        keyExtractor={(item) => String(item.OrderId)}
        contentContainerStyle={styles.list}
        refreshing={query.isFetching}
        onRefresh={query.refetch}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.OrderId })}>
            <View style={styles.row}><Text style={styles.id}>#{item.OrderId}</Text><OrderStatusBadge status={item.Status} /></View>
            <Text style={styles.meta}>{formatDateTime(item.OrderDate)}</Text>
            <Text style={styles.name}>{item.RecipientName} · {item.PhoneNumber}</Text>
            <Text style={styles.meta}>{[item.ShippingAddress, item.WardName, item.CityName].filter(Boolean).join(', ')}</Text>
            {(item.items || []).map((product) => <Text key={product.ProductId} style={styles.item}>• {product.ProductName} × {product.Quantity}</Text>)}
            <Text style={styles.money}>{formatCurrency(item.TotalAmount)} đ</Text>
            <Text style={styles.detailText}>Xem chi tiết ›</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  title: { fontFamily: FONTS.displayExtraBold, fontSize: 22, color: COLORS.dark, padding: 16 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 7 },
  tab: { flex: 1, alignItems: 'center', padding: 9, backgroundColor: COLORS.white, borderRadius: 10 },
  active: { backgroundColor: COLORS.primary },
  tabText: { fontFamily: FONTS.medium, color: COLORS.gray, fontSize: 12 },
  activeText: { color: COLORS.white },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, gap: 5, ...SHADOWS.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  id: { fontFamily: FONTS.bold, color: COLORS.dark },
  meta: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12 },
  name: { fontFamily: FONTS.semiBold, color: COLORS.dark },
  item: { fontFamily: FONTS.regular, color: COLORS.dark, fontSize: 12 },
  money: { textAlign: 'right', fontFamily: FONTS.bold, color: COLORS.primary },
  detailText: { textAlign: 'right', color: COLORS.primary, fontFamily: FONTS.semiBold, marginTop: 5 },
});
