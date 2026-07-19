import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import OrderStatusBadge from '../../components/order/OrderStatusBadge';

export default function CustomerDetailScreen() {
  const navigation = useNavigation(); const route = useRoute(); const qc = useQueryClient();
  const { adminService } = useServices(); const id = route.params?.customerId;
  const query = useQuery({ queryKey: ['customer', id], queryFn: () => adminService.getCustomer(id) });
  const mutation = useMutation({ mutationFn: (locked) => adminService.updateCustomerLock(id, locked), onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['customer', id] }); qc.invalidateQueries({ queryKey: ['customers'] }); Toast.show({ type: 'success', text1: 'Cập nhật thành công' });
  } });
  const customer = query.data || {};
  const toggle = (value) => Alert.alert(value ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?', value ? 'Người dùng sẽ không thể đăng nhập.' : 'Tài khoản sẽ có thể đăng nhập lại.', [
    { text: 'Hủy', style: 'cancel' }, { text: 'Xác nhận', style: value ? 'destructive' : 'default', onPress: () => mutation.mutate(value) },
  ]);
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={navigation.goBack}><Ionicons name="arrow-back" size={24} /></Pressable><Text style={styles.title}>Chi tiết khách hàng</Text></View>
    <View style={styles.card}><View style={styles.avatar}><Text style={styles.avatarText}>{String(customer.FullName || '?')[0]}</Text></View><Text style={styles.name}>{customer.FullName}</Text><Text style={styles.gray}>{customer.Email}</Text>
      <Info label="Số điện thoại" value={customer.PhoneNumber} /><Info label="Địa chỉ" value={[customer.Address, customer.WardName, customer.CityName].filter(Boolean).join(', ')} />
      <Info label="Ngày tạo" value={formatDateTime(customer.CreatedDate)} /><Info label="Tổng đơn" value={customer.totalOrders} /><Info label="Tổng chi tiêu" value={`${formatCurrency(customer.totalSpent)} đ`} /></View>
    <View style={styles.card}><View style={styles.switchRow}><Text style={[styles.status, { color: customer.IsLocked ? COLORS.error : COLORS.success }]}>{customer.IsLocked ? 'Tài khoản đang bị khóa' : 'Tài khoản hoạt động bình thường'}</Text>
      <Switch value={Boolean(customer.IsLocked)} onValueChange={toggle} disabled={mutation.isPending} /></View></View>
    <Text style={styles.section}>10 đơn hàng gần nhất</Text>{(customer.recentOrders || []).map((order) => <Pressable key={order.OrderId} style={styles.order} onPress={() => navigation.navigate('OrderDetail', { orderId: order.OrderId, readOnly: true })}>
      <View><Text style={styles.orderId}>#{order.OrderId} · {formatDateTime(order.OrderDate)}</Text><Text style={styles.gray}>{formatCurrency(order.TotalAmount)} đ</Text></View><OrderStatusBadge status={order.Status} /></Pressable>)}
  </ScrollView>;
}
function Info({ label, value }) { return <View style={styles.info}><Text style={styles.gray}>{label}</Text><Text style={styles.value}>{value || '—'}</Text></View>; }
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight }, content: { padding: 16, gap: 12 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: FONTS.displayExtraBold, fontSize: 21, color: COLORS.dark }, card: { backgroundColor: COLORS.white, padding: 16, borderRadius: 16, alignItems: 'center', ...SHADOWS.sm },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: FONTS.bold, color: COLORS.white, fontSize: 24 },
  name: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.dark, marginTop: 8 }, gray: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12 },
  info: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border }, value: { maxWidth: '62%', textAlign: 'right', fontFamily: FONTS.medium, color: COLORS.dark },
  switchRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, status: { flex: 1, fontFamily: FONTS.semiBold },
  section: { fontFamily: FONTS.displayBold, fontSize: 17, color: COLORS.dark }, order: { padding: 14, backgroundColor: COLORS.white, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontFamily: FONTS.semiBold, color: COLORS.dark },
});
