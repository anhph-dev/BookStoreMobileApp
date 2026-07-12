import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import OrderStatusBadge from '../../components/order/OrderStatusBadge';
import EmptyState from '../../components/common/EmptyState';
import AppInput from '../../components/common/AppInput';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const PAGE_SIZE = 8;

const statuses = [
  { value: 'All', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'Shipped', label: 'Đang giao' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const pad = (value) => String(value).padStart(2, '0');

const toDateInput = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    dateFrom: toDateInput(firstDay),
    dateTo: toDateInput(nextMonth),
  };
};

export default function OrderHistoryScreen() {
  const navigation = useNavigation();
  const { orderService } = useServices();
  const currentMonth = useMemo(getCurrentMonthRange, []);
  const [status, setStatus] = useState('All');
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: currentMonth.dateFrom,
    dateTo: currentMonth.dateTo,
  });

  // The default query is intentionally scoped to the current month and paged.
  // Older orders are available only when the user expands filters.
  const ordersQuery = useInfiniteQuery({
    queryKey: ['orders', status, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => orderService.getMyOrders({
      page: pageParam,
      limit: PAGE_SIZE,
      status: status === 'All' ? undefined : status,
      search: filters.search || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }),
    getNextPageParam: (lastPage) => (
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined
    ),
  });

  const orders = ordersQuery.data?.pages.flatMap((page) => page.orders) || [];
  const total = ordersQuery.data?.pages[0]?.total || 0;

  const applySearch = () => {
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const resetToCurrentMonth = () => {
    setSearchInput('');
    setStatus('All');
    setFilters({ search: '', dateFrom: currentMonth.dateFrom, dateTo: currentMonth.dateTo });
  };

  const loadMore = () => {
    if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
      ordersQuery.fetchNextPage();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Đơn hàng của tôi</Text>
          <Text style={styles.subtitle}>Mặc định hiển thị đơn trong tháng này</Text>
        </View>
        <Pressable onPress={() => setAdvancedVisible((current) => !current)} style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
        style={styles.tabScroller}
      >
        {statuses.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setStatus(item.value)}
            style={[styles.tab, status === item.value && styles.tabActive]}
          >
            <Text numberOfLines={1} style={[styles.tabText, status === item.value && styles.tabTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {advancedVisible ? (
        <View style={styles.advancedPanel}>
          <AppInput
            leftIcon="search-outline"
            placeholder="Tìm mã đơn, người nhận, SĐT..."
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
            onSubmitEditing={applySearch}
          />
          <View style={styles.dateRow}>
            <AppInput
              label="Từ ngày"
              value={filters.dateFrom}
              onChangeText={(value) => setFilters((current) => ({ ...current, dateFrom: value }))}
              placeholder="YYYY-MM-DD"
              containerStyle={styles.dateInput}
            />
            <AppInput
              label="Đến ngày"
              value={filters.dateTo}
              onChangeText={(value) => setFilters((current) => ({ ...current, dateTo: value }))}
              placeholder="YYYY-MM-DD"
              containerStyle={styles.dateInput}
            />
          </View>
          <View style={styles.actionRow}>
            <Pressable onPress={applySearch} style={styles.applyButton}>
              <Text style={styles.applyLabel}>Áp dụng</Text>
            </Pressable>
            <Pressable onPress={resetToCurrentMonth} style={styles.resetButton}>
              <Text style={styles.resetLabel}>Tháng này</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Text style={styles.resultHint}>{total} đơn phù hợp</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.orderId || item.OrderId)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => {
          const orderId = item.orderId || item.OrderId;
          const statusValue = item.status || item.Status;
          const orderDate = item.orderDate || item.OrderDate;
          const totalAmount = item.totalAmount || item.TotalAmount;

          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.orderTitle}>Đơn #{orderId}</Text>
                <OrderStatusBadge status={statusValue} />
              </View>
              <Text style={styles.date}>{formatDateTime(orderDate)}</Text>
              <Text style={styles.total}>Tổng tiền: {formatCurrency(totalAmount)} đ</Text>
              <Pressable onPress={() => navigation.navigate('OrderDetail', { orderId })} style={styles.detailButton}>
                <Text style={styles.detailLabel}>Xem chi tiết</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          ordersQuery.isLoading
            ? <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            : <EmptyState title="Chưa có đơn hàng nào" subtitle="Thử mở rộng khoảng ngày hoặc thay đổi bộ lọc." />
        }
        ListFooterComponent={
          ordersQuery.isFetchingNextPage ? <ActivityIndicator color={COLORS.primary} style={styles.footerLoader} /> : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.dark },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12, marginTop: 2 },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  tabScroller: { flexGrow: 0 },
  tabRow: { gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  tab: {
    minWidth: 96,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontFamily: FONTS.medium, color: COLORS.gray, fontSize: 14, lineHeight: 18 },
  tabTextActive: { color: COLORS.white },
  advancedPanel: { marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: SIZES.radius, backgroundColor: COLORS.white, ...SHADOWS.sm, gap: 10 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: { flex: 1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  applyButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: SIZES.radius, backgroundColor: COLORS.primary },
  applyLabel: { fontFamily: FONTS.medium, color: COLORS.white },
  resetButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: SIZES.radius, backgroundColor: COLORS.grayLight },
  resetLabel: { fontFamily: FONTS.medium, color: COLORS.dark },
  resultHint: { paddingHorizontal: 16, paddingBottom: 6, fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12 },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16, ...SHADOWS.sm, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  orderTitle: { fontFamily: FONTS.displayBold, color: COLORS.dark },
  date: { fontFamily: FONTS.regular, color: COLORS.gray },
  total: { fontFamily: FONTS.medium, color: COLORS.primary },
  detailButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  detailLabel: { fontFamily: FONTS.medium, color: COLORS.primary },
  loader: { marginTop: 28 },
  footerLoader: { marginVertical: 16 },
});
