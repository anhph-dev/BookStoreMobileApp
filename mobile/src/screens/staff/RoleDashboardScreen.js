import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { firstName, formatCurrency } from '../../utils/formatters';

const roleConfig = {
  Sale: {
    title: 'Tổng quan bán hàng',
    orderTab: 'SaleOrders',
    cards: [
      ['Pending', 'Đơn chờ xác nhận', 'time-outline', COLORS.warning],
      ['Confirmed', 'Đã xác nhận', 'checkmark-circle-outline', COLORS.success],
    ],
    actions: [
      ['Tạo đơn tại quầy', 'add-circle-outline', 'SaleOrders', { screen: 'SaleCreateOrder' }],
      ['Xử lý đơn mới', 'receipt-outline', 'SaleOrders', { screen: 'SaleOrderList', params: { initialStatus: 'Pending' } }],
      ['Tra cứu khách hàng', 'people-outline', 'Customers'],
    ],
  },
  NVKho: {
    title: 'Tổng quan kho',
    orderTab: 'WarehouseOrders',
    cards: [
      ['Confirmed', 'Chờ lấy hàng', 'file-tray-outline', COLORS.warning],
      ['Shipping', 'Đang xử lý', 'cube-outline', COLORS.info],
      ['Shipped', 'Đã bàn giao', 'checkmark-done-outline', COLORS.success],
    ],
    actions: [
      ['Xử lý đơn kho', 'receipt-outline', 'WarehouseOrders'],
      ['Kiểm tra tồn kho', 'layers-outline', 'Inventory'],
      ['Cập nhật sản phẩm', 'book-outline', 'Products'],
    ],
  },
};

export default function RoleDashboardScreen({ role }) {
  const config = roleConfig[role];
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);
  const { adminService, warehouseService } = useServices();
  const ordersQuery = useQuery({
    queryKey: ['role-dashboard-orders', role],
    queryFn: () => adminService.getOrders({ limit: 100 }),
  });
  const inventoryQuery = useQuery({
    queryKey: ['role-dashboard-inventory'],
    queryFn: () => warehouseService.getInventory({ stockStatus: 'all' }),
    enabled: role === 'NVKho',
  });
  const orders = ordersQuery.data?.orders || [];
  const countStatus = (status) => orders.filter((order) => order.Status === status).length;
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.OrderDate).toDateString() === today);
  const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.TotalAmount || 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View><Text style={styles.title}>{config.title}</Text><Text style={styles.subtitle}>Xin chào, {firstName(user?.fullName)}</Text></View>
        <Pressable style={styles.refresh} onPress={() => {
          ordersQuery.refetch();
          if (role === 'NVKho') inventoryQuery.refetch();
        }}>
          <Ionicons name="refresh-outline" size={22} color={COLORS.primary} />
        </Pressable>
      </View>
      {role === 'Sale' ? (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Doanh số hôm nay</Text>
          <Text style={styles.heroValue}>{formatCurrency(todayRevenue)} đ</Text>
          <Text style={styles.heroMeta}>{todayOrders.length} đơn hàng</Text>
        </View>
      ) : (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Tình trạng tồn kho</Text>
          <Text style={styles.heroValue}>{inventoryQuery.data?.total || 0} sản phẩm</Text>
          <Text style={styles.heroMeta}>{inventoryQuery.data?.lowStockCount || 0} sắp hết · {inventoryQuery.data?.outOfStockCount || 0} hết hàng</Text>
        </View>
      )}
      <View style={styles.grid}>
        {config.cards.map(([status, label, icon, color]) => (
          <Pressable key={status} style={styles.card} onPress={() => navigation.navigate(config.orderTab)}>
            <View style={[styles.icon, { backgroundColor: `${color}1A` }]}><Ionicons name={icon} size={22} color={color} /></View>
            <Text style={styles.cardValue}>{countStatus(status)}</Text>
            <Text style={styles.cardLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        {config.actions.map(([label, icon, route, params]) => (
          <Pressable key={label} style={styles.action} onPress={() => navigation.navigate(route, params)}>
            <View style={styles.actionIcon}><Ionicons name={icon} size={21} color={COLORS.primary} /></View>
            <Text style={styles.actionText}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FONTS.displayExtraBold, fontSize: 24, color: COLORS.dark },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.gray, marginTop: 3 },
  refresh: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  hero: { backgroundColor: COLORS.primary, borderRadius: 18, padding: 18, ...SHADOWS.md },
  heroLabel: { color: COLORS.white, fontFamily: FONTS.medium, opacity: 0.9 },
  heroValue: { color: COLORS.white, fontFamily: FONTS.displayExtraBold, fontSize: 26, marginTop: 4 },
  heroMeta: { color: COLORS.white, fontFamily: FONTS.regular, marginTop: 3, opacity: 0.85 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { flexGrow: 1, flexBasis: '30%', minWidth: 100, backgroundColor: COLORS.white, borderRadius: 15, padding: 13, ...SHADOWS.sm },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardValue: { fontFamily: FONTS.displayExtraBold, fontSize: 22, color: COLORS.dark, marginTop: 8 },
  cardLabel: { fontFamily: FONTS.medium, color: COLORS.gray, fontSize: 11, marginTop: 2 },
  section: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, ...SHADOWS.sm },
  sectionTitle: { fontFamily: FONTS.displayBold, fontSize: 17, color: COLORS.dark, marginBottom: 6 },
  action: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  actionIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, fontFamily: FONTS.semiBold, color: COLORS.dark },
});
