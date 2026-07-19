import React from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import OrderStatusBadge from '../../components/order/OrderStatusBadge';
import AppButton from '../../components/common/AppButton';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const getValue = (source, camelKey, pascalKey) => source?.[camelKey] ?? source?.[pascalKey];

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderService, adminService } = useServices();
  const role = useSelector((state) => state.auth.user?.role);
  const queryClient = useQueryClient();
  const orderId = route.params?.orderId;

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: Boolean(orderId),
  });
  const statusMutation = useMutation({
    mutationFn: (nextStatus) => adminService.updateOrderStatus(orderId, nextStatus),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
        queryClient.invalidateQueries({ queryKey: ['sale-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['nvkho-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
      ]);
    },
    onError: (error) => Alert.alert('Không thể cập nhật', error?.response?.data?.message || 'Vui lòng thử lại.'),
  });

  const order = orderQuery.data;

  if (orderQuery.isLoading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  const items = order.items || [];
  const status = getValue(order, 'status', 'Status');
  const orderDate = getValue(order, 'orderDate', 'OrderDate');
  const totalAmount = getValue(order, 'totalAmount', 'TotalAmount');
  const recipientName = getValue(order, 'recipientName', 'RecipientName');
  const phoneNumber = getValue(order, 'phoneNumber', 'PhoneNumber');
  const shippingAddress = getValue(order, 'shippingAddress', 'ShippingAddress');
  const cityName = getValue(order, 'cityName', 'CityName');
  const wardName = getValue(order, 'wardName', 'WardName');
  const paymentMethod = getValue(order, 'paymentMethod', 'PaymentMethod');
  const paymentStatus = getValue(order, 'paymentStatus', 'PaymentStatus');
  const paidAt = getValue(order, 'paidAt', 'PaidAt');
  const nextStatus = role === 'Sale' && status === 'Pending'
    ? 'Confirmed'
    : role === 'NVKho' && status === 'Confirmed'
      ? 'Shipping'
      : role === 'NVKho' && status === 'Shipping'
        ? 'Shipped'
        : null;
  const actionLabel = nextStatus === 'Confirmed'
    ? 'Xác nhận đơn hàng'
    : nextStatus === 'Shipping'
      ? 'Bắt đầu giao hàng'
      : nextStatus === 'Shipped'
        ? 'Xác nhận đã giao'
        : '';
  const confirmStatusUpdate = () => Alert.alert(
    actionLabel,
    `Bạn đã kiểm tra đầy đủ thông tin đơn #${orderId}?`,
    [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', onPress: () => statusMutation.mutate(nextStatus) },
    ],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color={COLORS.dark} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text numberOfLines={1} style={styles.title}>Đơn #{orderId}</Text>
          <Text numberOfLines={1} style={styles.subtitle}>{formatDateTime(orderDate)}</Text>
        </View>
        <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} style={styles.iconButton}>
          <Ionicons name="home-outline" size={20} color={COLORS.dark} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Main', { screen: 'CartTab' })} style={styles.iconButton}>
          <Ionicons name="cart-outline" size={20} color={COLORS.dark} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusPanel}>
          <View>
            <Text style={styles.panelLabel}>Trạng thái đơn hàng</Text>
            <Text style={styles.panelValue}>{formatCurrency(totalAmount)} đ</Text>
          </View>
          <OrderStatusBadge status={status} />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Sản phẩm ({items.length})</Text>
          </View>

          {items.map((item) => {
            const detailId = getValue(item, 'orderDetailId', 'OrderDetailId');
            const productName = getValue(item, 'productName', 'ProductName');
            const imageUrl = getValue(item, 'imageUrl', 'ImageUrl');
            const quantity = Number(getValue(item, 'quantity', 'Quantity') || 0);
            const unitPrice = Number(getValue(item, 'unitPrice', 'UnitPrice') || 0);

            return (
              <View key={String(detailId || productName)} style={styles.itemRow}>
                {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.itemImage} /> : <View style={styles.itemImagePlaceholder} />}
                <View style={styles.itemContent}>
                  <Text numberOfLines={2} style={styles.itemName}>{productName}</Text>
                  <Text style={styles.itemMeta}>SL {quantity} x {formatCurrency(unitPrice)} đ</Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(quantity * unitPrice)} đ</Text>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)} đ</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
          </View>
          <Text style={styles.primaryLine}>{recipientName}</Text>
          <Text style={styles.line}>{phoneNumber}</Text>
          <Text style={styles.line}>{[shippingAddress, wardName, cityName].filter(Boolean).join(', ')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Thanh toán</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phương thức</Text>
            <Text style={styles.infoValue}>{paymentMethod || 'COD'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái</Text>
            <Text style={styles.infoValue}>{paymentStatus || 'Pending'}</Text>
          </View>
          {paidAt ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Đã thanh toán lúc</Text>
              <Text style={styles.infoValue}>{formatDateTime(paidAt)}</Text>
            </View>
          ) : null}
        </View>

        {role !== 'Customer' ? (
          <View style={styles.actions}>
            {nextStatus ? <AppButton label={statusMutation.isPending ? 'Đang cập nhật...' : actionLabel} onPress={confirmStatusUpdate} disabled={statusMutation.isPending} fullWidth /> : null}
            <AppButton label="Quay lại danh sách đơn" onPress={() => navigation.goBack()} variant="outline" fullWidth />
          </View>
        ) : null}
        <View style={[styles.actions, role !== 'Customer' && styles.hidden]}>
          <AppButton label="Về danh sách đơn" onPress={() => navigation.navigate('OrderHistory')} variant="outline" fullWidth />
          <AppButton label="Tiếp tục mua sách" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} fullWidth />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.white },
  loadingText: { fontFamily: FONTS.medium, color: COLORS.gray },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1, minWidth: 0 },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.dark },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12, marginTop: 2 },
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  statusPanel: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radius,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  panelLabel: { fontFamily: FONTS.medium, color: COLORS.gray, marginBottom: 4 },
  panelValue: { fontFamily: FONTS.displayBold, fontSize: 22, color: COLORS.primary },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16, gap: 12, ...SHADOWS.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: FONTS.displayBold, color: COLORS.dark, fontSize: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  itemImage: { width: 52, height: 52, borderRadius: 8, backgroundColor: COLORS.grayLight },
  itemImagePlaceholder: { width: 52, height: 52, borderRadius: 8, backgroundColor: COLORS.grayLight },
  itemContent: { flex: 1, minWidth: 0 },
  itemName: { fontFamily: FONTS.semiBold, color: COLORS.dark },
  itemMeta: { fontFamily: FONTS.regular, color: COLORS.gray, marginTop: 3 },
  itemTotal: { fontFamily: FONTS.bold, color: COLORS.primary },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontFamily: FONTS.displayBold, color: COLORS.dark },
  totalValue: { fontFamily: FONTS.displayBold, color: COLORS.primary },
  primaryLine: { fontFamily: FONTS.semiBold, color: COLORS.dark },
  line: { fontFamily: FONTS.regular, color: COLORS.gray, lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontFamily: FONTS.regular, color: COLORS.gray },
  infoValue: { fontFamily: FONTS.medium, color: COLORS.dark, textAlign: 'right', flex: 1 },
  actions: { gap: 10 },
  hidden: { display: 'none' },
});
