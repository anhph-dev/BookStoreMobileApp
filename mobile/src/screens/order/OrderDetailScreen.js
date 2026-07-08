import React from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import OrderStatusBadge from '../../components/order/OrderStatusBadge';
import { formatDateTime } from '../../utils/formatters';

export default function OrderDetailScreen() {
  const route = useRoute();
  const { orderService } = useServices();
  const orderId = route.params?.orderId;

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: Boolean(orderId),
  });

  const order = orderQuery.data;
  if (!order) {
    return <View style={styles.center}><Text style={styles.empty}>Đang tải chi tiết đơn hàng...</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.title}>Chi tiết đơn #{orderId}</Text>
      <View style={styles.card}><OrderStatusBadge status={order.Status} /><Text style={styles.date}>{formatDateTime(order.OrderDate)}</Text></View>
      <View style={styles.card}>
        <Text style={styles.section}>Sản phẩm</Text>
        <FlatList data={order.items || []} scrollEnabled={false} keyExtractor={(item) => String(item.OrderDetailId)} renderItem={({ item }) => <Text style={styles.line}>• {item.ProductName} x{item.Quantity}</Text>} />
      </View>
      <View style={styles.card}><Text style={styles.section}>Địa chỉ nhận hàng</Text><Text style={styles.line}>{order.RecipientName}</Text><Text style={styles.line}>{order.PhoneNumber}</Text><Text style={styles.line}>{order.ShippingAddress}</Text></View>
      <View style={styles.card}><Text style={styles.section}>Thanh toán</Text><Text style={styles.line}>{order.PaymentMethod}</Text><Text style={styles.line}>{order.PaymentStatus}</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: FONTS.medium, color: COLORS.gray },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.dark },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16, gap: 8, ...SHADOWS.sm },
  section: { fontFamily: FONTS.displayBold, color: COLORS.dark },
  date: { fontFamily: FONTS.regular, color: COLORS.gray },
  line: { fontFamily: FONTS.regular, color: COLORS.dark },
});
