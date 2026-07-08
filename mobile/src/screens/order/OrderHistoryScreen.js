import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import OrderStatusBadge from '../../components/order/OrderStatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime } from '../../utils/formatters';

const statuses = ['All', 'Pending', 'Shipped', 'Completed', 'Cancelled'];

export default function OrderHistoryScreen() {
  const navigation = useNavigation();
  const { orderService } = useServices();
  const [status, setStatus] = useState('All');

  const ordersQuery = useQuery({
    queryKey: ['orders', status],
    queryFn: () => orderService.getMyOrders(status === 'All' ? {} : { status }),
  });

  const orders = ordersQuery.data || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đơn hàng của tôi</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {statuses.map((item) => (
          <Pressable key={item} onPress={() => setStatus(item)} style={[styles.tab, status === item && styles.tabActive]}>
            <Text style={[styles.tabText, status === item && styles.tabTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.OrderId)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.orderTitle}>Đơn #{item.OrderId}</Text><OrderStatusBadge status={item.Status} /></View>
            <Text style={styles.date}>{formatDateTime(item.OrderDate)}</Text>
            <Text style={styles.total}>Tổng tiền: {Number(item.TotalAmount || 0).toLocaleString('vi-VN')} đ</Text>
            <Pressable onPress={() => navigation.navigate('OrderDetail', { orderId: item.OrderId })} style={styles.detailButton}>
              <Text style={styles.detailLabel}>Xem chi tiết</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Chưa có đơn hàng nào" subtitle="Khi bạn đặt hàng, lịch sử sẽ xuất hiện ở đây." />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.dark, padding: 16, paddingBottom: 0 },
  tabRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.grayLight },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontFamily: FONTS.medium, color: COLORS.gray },
  tabTextActive: { color: COLORS.white },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.sm, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTitle: { fontFamily: FONTS.displayBold, color: COLORS.dark },
  date: { fontFamily: FONTS.regular, color: COLORS.gray },
  total: { fontFamily: FONTS.medium, color: COLORS.primary },
  detailButton: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.primary },
  detailLabel: { fontFamily: FONTS.medium, color: COLORS.primary },
});
