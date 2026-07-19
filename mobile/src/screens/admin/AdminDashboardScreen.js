import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { formatCurrency } from '../../utils/formatters';

const width = Dimensions.get('window').width - 32;
const moneyShort = (value) => {
  const number = Number(value || 0);
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M đ`;
  if (number >= 1000) return `${Math.round(number / 1000)}k đ`;
  return `${number} đ`;
};
const statusColors = { Pending: COLORS.warning, Confirmed: COLORS.primary, Shipping: COLORS.info, Shipped: COLORS.info, Completed: COLORS.success, Cancelled: COLORS.error };
const chartConfig = {
  backgroundGradientFrom: COLORS.white, backgroundGradientTo: COLORS.white, decimalPlaces: 0,
  color: () => COLORS.primary, labelColor: () => COLORS.gray, propsForDots: { r: '3' },
};

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { adminService } = useServices();
  const query = useQuery({ queryKey: ['dashboard'], queryFn: adminService.getDashboard });
  const data = query.data || {};
  const revenue = data.revenueByDay || [];
  const categories = (data.revenueByCategory || []).slice(0, 6);
  const cards = [
    ['receipt-outline', data.todayOrders, 'Đơn hôm nay', COLORS.primary],
    ['cash-outline', moneyShort(data.todayRevenue), 'Doanh thu hôm nay', COLORS.success],
    ['time-outline', data.pendingOrders, 'Chờ xử lý', COLORS.warning],
    ['alert-circle-outline', data.lowStockProducts?.length || 0, 'Sắp hết hàng', COLORS.error],
  ];
  if (query.isLoading) return <View style={styles.loading}>{[1, 2, 3, 4, 5, 6].map((x) => <View key={x} style={styles.skeleton} />)}</View>;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={undefined}>
      <View style={styles.header}><View><Text style={styles.title}>Dashboard</Text><Text style={styles.sub}>30 ngày gần nhất</Text></View>
        <Pressable onPress={() => query.refetch()}><Ionicons name="refresh-outline" size={25} color={COLORS.primary} /></Pressable></View>
      <View style={styles.grid}>{cards.map(([icon, value, label, color]) => <View key={label} style={[styles.card, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color={COLORS.white} /><Text style={styles.cardValue}>{value ?? 0}</Text><Text style={styles.cardLabel}>{label}</Text>
      </View>)}</View>
      <Section title="Doanh thu 30 ngày">
        <LineChart width={width - 24} height={200} bezier chartConfig={chartConfig}
          data={{ labels: revenue.map((x, i) => (i % Math.max(1, Math.ceil(revenue.length / 7)) === 0 ? new Date(x.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '')),
            datasets: [{ data: revenue.length ? revenue.map((x) => Number(x.revenue || 0)) : [0] }] }}
          formatYLabel={(v) => moneyShort(v).replace(' đ', '')} style={styles.chart} />
      </Section>
      <Section title="Phân bố đơn hàng">
        <PieChart width={width - 24} height={200} accessor="population" backgroundColor="transparent" paddingLeft="4"
          chartConfig={chartConfig} data={(data.ordersByStatus || []).map((x) => ({ name: x.status, population: Number(x.count), color: statusColors[x.status] || COLORS.gray, legendFontColor: COLORS.dark, legendFontSize: 11 }))} />
      </Section>
      <Section title="Doanh thu theo danh mục">
        <BarChart width={width - 24} height={220} fromZero chartConfig={{ ...chartConfig, color: () => COLORS.secondary }}
          data={{ labels: categories.map((x) => String(x.categoryName).slice(0, 8)), datasets: [{ data: categories.length ? categories.map((x) => Number(x.revenue || 0)) : [0] }] }}
          formatYLabel={(v) => moneyShort(v).replace(' đ', '')} style={styles.chart} />
      </Section>
      <Section title="⚠️ Sản phẩm sắp hết hàng" titleColor={COLORS.warning}>
        {(data.lowStockProducts || []).slice(0, 5).map((item) => <View key={item.productId} style={styles.row}><Text style={styles.rowName}>{item.productName}</Text>
          <Text style={styles.stock}>{item.stock}</Text><Pressable onPress={() => navigation.navigate('ProductForm', { productId: item.productId })}><Text style={styles.link}>Cập nhật</Text></Pressable></View>)}
      </Section>
      <Section title="Top 5 sách bán chạy">{(data.topProducts || []).map((item, index) => <View key={item.productId} style={styles.row}>
        <Text style={styles.rank}>{index + 1}</Text><View style={styles.rowName}><Text style={styles.name}>{item.productName}</Text><Text style={styles.sub}>{item.totalSold} cuốn</Text></View>
        <Text style={styles.money}>{formatCurrency(item.revenue)} đ</Text></View>)}</Section>
    </ScrollView>
  );
}

function Section({ title, titleColor, children }) {
  return <View style={styles.section}><Text style={[styles.sectionTitle, titleColor && { color: titleColor }]}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight }, content: { padding: 16, gap: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { fontFamily: FONTS.displayExtraBold, fontSize: 24, color: COLORS.dark },
  sub: { fontFamily: FONTS.regular, color: COLORS.gray, marginTop: 2 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', borderRadius: 16, padding: 14, minHeight: 118, ...SHADOWS.sm }, cardValue: { fontFamily: FONTS.displayExtraBold, color: COLORS.white, fontSize: 23, marginTop: 8 },
  cardLabel: { fontFamily: FONTS.medium, color: COLORS.white }, section: { backgroundColor: COLORS.white, borderRadius: 16, padding: 12, ...SHADOWS.sm },
  sectionTitle: { fontFamily: FONTS.displayBold, fontSize: 16, color: COLORS.dark, marginBottom: 10 }, chart: { borderRadius: 12 },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowName: { flex: 1, fontFamily: FONTS.medium, color: COLORS.dark }, stock: { color: COLORS.white, backgroundColor: COLORS.error, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  link: { color: COLORS.primary, fontFamily: FONTS.semiBold }, rank: { backgroundColor: COLORS.primary, color: COLORS.white, width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, fontFamily: FONTS.bold },
  name: { fontFamily: FONTS.semiBold, color: COLORS.dark }, money: { fontFamily: FONTS.semiBold, color: COLORS.primary, fontSize: 12 },
  loading: { flex: 1, backgroundColor: COLORS.grayLight, padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  skeleton: { width: '47%', height: 130, borderRadius: 16, backgroundColor: COLORS.border },
});
