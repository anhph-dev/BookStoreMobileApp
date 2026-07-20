import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import OrderStatusBadge from './OrderStatusBadge';

export default function StaffOrderList({
  role,
  title,
  subtitle,
  filters,
  initialStatus = '',
  searchable = false,
  showAddress = false,
  createOrder = false,
}) {
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const navigation = useNavigation();
  const { adminService } = useServices();
  const query = useQuery({
    queryKey: ['staff-orders', role, status, search],
    queryFn: () => adminService.getOrders({
      status: status || undefined,
      search: search.trim() || undefined,
      limit: 100,
    }),
  });
  const orders = query.data?.orders || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {searchable ? (
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color={COLORS.gray} />
          <TextInput
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            placeholder="Tên người nhận / SĐT"
            returnKeyType="search"
          />
        </View>
      ) : null}
      <View style={styles.filters}>
        {filters.map(([key, label]) => (
          <Pressable key={key} onPress={() => setStatus(key)} style={[styles.filter, status === key && styles.filterActive]}>
            <Text style={[styles.filterText, status === key && styles.filterTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.OrderId)}
        contentContainerStyle={[styles.list, createOrder && styles.listWithFab]}
        refreshing={query.isFetching}
        onRefresh={query.refetch}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={42} color={COLORS.border} />
            <Text style={styles.emptyText}>{query.isError ? 'Không thể tải đơn hàng' : 'Không có đơn hàng phù hợp'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.OrderId })}>
            <View style={styles.row}>
              <Text style={styles.id}>#{item.OrderId}</Text>
              <OrderStatusBadge status={item.Status} />
            </View>
            <Text style={styles.meta}>{formatDateTime(item.OrderDate)}{item.Channel ? ` · ${item.Channel}` : ''}</Text>
            <Text style={styles.name}>{item.RecipientName}{item.PhoneNumber ? ` · ${item.PhoneNumber}` : ''}</Text>
            {showAddress ? (
              <Text style={styles.meta}>{[item.ShippingAddress, item.WardName, item.CityName].filter(Boolean).join(', ')}</Text>
            ) : null}
            {showAddress ? (item.items || []).slice(0, 3).map((product) => (
              <Text key={product.ProductId} style={styles.item}>• {product.ProductName} × {product.Quantity}</Text>
            )) : null}
            <View style={styles.footer}>
              <Text style={styles.money}>{formatCurrency(item.TotalAmount)} đ</Text>
              <View style={styles.detail}><Text style={styles.detailText}>Xem chi tiết</Text><Ionicons name="chevron-forward" size={16} color={COLORS.primary} /></View>
            </View>
          </Pressable>
        )}
      />
      {createOrder ? (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('SaleCreateOrder')}>
          <Ionicons name="add" size={22} color={COLORS.white} /><Text style={styles.fabText}>Tạo đơn mới</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  header: { padding: 16, paddingBottom: 10 },
  title: { fontFamily: FONTS.displayExtraBold, fontSize: 22, color: COLORS.dark },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.gray, marginTop: 3 },
  searchBox: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12 },
  search: { flex: 1, height: 44, fontFamily: FONTS.regular, color: COLORS.dark },
  filters: { flexDirection: 'row', gap: 7, padding: 16, paddingBottom: 8 },
  filter: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 38, paddingHorizontal: 8, backgroundColor: COLORS.white, borderRadius: 12 },
  filterActive: { backgroundColor: COLORS.primary },
  filterText: { color: COLORS.gray, fontFamily: FONTS.medium, fontSize: 12, textAlign: 'center' },
  filterTextActive: { color: COLORS.white },
  list: { padding: 16, paddingTop: 8, gap: 10, flexGrow: 1 },
  listWithFab: { paddingBottom: 90 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, gap: 5, ...SHADOWS.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontFamily: FONTS.bold, color: COLORS.dark },
  meta: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12 },
  name: { fontFamily: FONTS.semiBold, color: COLORS.dark },
  item: { fontFamily: FONTS.regular, color: COLORS.dark, fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  money: { fontFamily: FONTS.bold, color: COLORS.primary },
  detail: { flexDirection: 'row', alignItems: 'center' },
  detailText: { color: COLORS.primary, fontFamily: FONTS.semiBold, fontSize: 12 },
  empty: { flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { color: COLORS.gray, fontFamily: FONTS.medium },
  fab: { position: 'absolute', right: 18, bottom: 18, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 16, height: 52, borderRadius: 26, ...SHADOWS.md },
  fabText: { color: COLORS.white, fontFamily: FONTS.bold },
});
