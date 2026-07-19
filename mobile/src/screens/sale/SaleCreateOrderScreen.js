import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { formatCurrency } from '../../utils/formatters';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import PickerField from '../../components/common/PickerField';

export default function SaleCreateOrderScreen() {
  const navigation = useNavigation(); const { adminService, productService } = useServices();
  const [customerSearch, setCustomerSearch] = useState(''); const [productSearch, setProductSearch] = useState('');
  const [customer, setCustomer] = useState(null); const [items, setItems] = useState([]); const [form, setForm] = useState({ recipientName: '', phoneNumber: '', shippingAddress: '', notes: '', paymentMethod: 'COD', cityId: null, wardId: null });
  const [cityOpen, setCityOpen] = useState(false); const [wardOpen, setWardOpen] = useState(false);
  const customers = useQuery({ queryKey: ['sale-customer-search', customerSearch], enabled: customerSearch.trim().length >= 2, queryFn: () => adminService.searchSaleCustomers({ search: customerSearch }) });
  const products = useQuery({ queryKey: ['sale-product-search', productSearch], enabled: productSearch.trim().length >= 2, queryFn: () => productService.getProducts({ search: productSearch, limit: 5 }) });
  const cities = useQuery({ queryKey: ['cities'], queryFn: productService.getCities }); const wards = useQuery({ queryKey: ['wards', form.cityId], enabled: Boolean(form.cityId), queryFn: () => productService.getWards(form.cityId) });
  const total = useMemo(() => items.reduce((sum, x) => sum + x.quantity * x.price, 0), [items]);
  const mutation = useMutation({ mutationFn: (payload) => adminService.createSaleOrder(payload), onSuccess: (result) => navigation.navigate('OrderSuccess', { orderId: result.orderId }), onError: (e) => Toast.show({ type: 'error', text1: e.response?.data?.message || 'Không thể tạo đơn' }) });
  const chooseCustomer = (item) => { setCustomer(item); setCustomerSearch(''); setForm((x) => ({ ...x, recipientName: item.FullName || '', phoneNumber: item.PhoneNumber || '', shippingAddress: item.Address || '', cityId: item.CityId || null, wardId: item.WardId || null })); };
  const add = (p) => setItems((old) => old.some((x) => x.productId === p.productId) ? old.map((x) => x.productId === p.productId ? { ...x, quantity: x.quantity + 1 } : x) : [...old, { productId: p.productId, name: p.productName, price: Number(p.price), quantity: 1 }]);
  const change = (id, delta) => setItems((old) => old.map((x) => x.productId === id ? { ...x, quantity: Math.max(1, x.quantity + delta) } : x));
  const submit = () => mutation.mutate({ ...form, customerId: customer?.UserId || null, items: items.map((x) => ({ productId: x.productId, quantity: x.quantity, unitPrice: x.price })) });
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}><Text style={styles.title}>Tạo đơn hàng mới</Text><Text style={styles.sub}>Đặt hàng qua điện thoại</Text>
    <Section title="1. Tìm kiếm khách hàng"><TextInput style={styles.search} value={customerSearch} onChangeText={setCustomerSearch} placeholder="Tên / SĐT / email" />
      {(customers.data?.customers || []).map((x) => <Pressable key={x.UserId} style={styles.result} onPress={() => chooseCustomer(x)}><Text style={styles.name}>{x.FullName}</Text><Text style={styles.sub}>{x.PhoneNumber}</Text></Pressable>)}
      <Pressable onPress={() => { setCustomer(null); setForm((x) => ({ ...x, recipientName: '', phoneNumber: '', shippingAddress: '' })); }}><Text style={styles.link}>Khách lẻ (không tìm kiếm)</Text></Pressable></Section>
    <Section title="2. Thông tin người nhận"><AppInput label="Họ tên người nhận" value={form.recipientName} onChangeText={(v) => setForm({ ...form, recipientName: v })} />
      <AppInput label="Số điện thoại" value={form.phoneNumber} onChangeText={(v) => setForm({ ...form, phoneNumber: v })} />
      <PickerField label="Tỉnh / Thành phố" value={cities.data?.find((x) => x.cityId === form.cityId)?.cityName} options={cities.data} visible={cityOpen} onOpen={() => setCityOpen(true)} onClose={() => setCityOpen(false)} getLabel={(x) => x.cityName} onSelect={(x) => setForm({ ...form, cityId: x.cityId, wardId: null })} />
      <PickerField label="Phường / Xã" value={wards.data?.find((x) => x.wardId === form.wardId)?.wardName} options={wards.data} visible={wardOpen} onOpen={() => setWardOpen(true)} onClose={() => setWardOpen(false)} getLabel={(x) => x.wardName} onSelect={(x) => setForm({ ...form, wardId: x.wardId })} />
      <AppInput label="Địa chỉ cụ thể" value={form.shippingAddress} onChangeText={(v) => setForm({ ...form, shippingAddress: v })} /><AppInput label="Ghi chú" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} /></Section>
    <Section title="3. Chọn sản phẩm"><TextInput style={styles.search} value={productSearch} onChangeText={setProductSearch} placeholder="Tìm sách..." />
      {(products.data?.products || []).map((p) => <Pressable key={p.productId} style={styles.result} onPress={() => add(p)}><Text style={styles.name}>{p.productName}</Text><Text style={styles.link}>+ {formatCurrency(p.price)} đ</Text></Pressable>)}
      {items.map((x) => <View key={x.productId} style={styles.item}><Text style={styles.itemName}>{x.name}</Text><Pressable onPress={() => change(x.productId, -1)}><Text style={styles.qty}>−</Text></Pressable><Text>{x.quantity}</Text><Pressable onPress={() => change(x.productId, 1)}><Text style={styles.qty}>+</Text></Pressable><Pressable onPress={() => setItems(items.filter((i) => i.productId !== x.productId))}><Text style={styles.remove}>×</Text></Pressable></View>)}
      <Text style={styles.total}>Tổng tiền: {formatCurrency(total)} đ</Text></Section>
    <Section title="4. Thanh toán"><View style={styles.payments}>{['CASH', 'COD', 'BankTransfer'].map((x) => <Pressable key={x} style={[styles.pay, form.paymentMethod === x && styles.payActive]} onPress={() => setForm({ ...form, paymentMethod: x })}><Text style={form.paymentMethod === x && styles.payText}>{x}</Text></Pressable>)}</View></Section>
    <AppButton label="Tạo đơn hàng" onPress={submit} loading={mutation.isPending} disabled={!items.length || !form.recipientName || !form.phoneNumber || !form.shippingAddress} fullWidth />
  </ScrollView>;
}
function Section({ title, children }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight }, content: { padding: 16, gap: 12, paddingBottom: 40 }, title: { fontFamily: FONTS.displayExtraBold, fontSize: 22, color: COLORS.dark }, sub: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12 },
  section: { backgroundColor: COLORS.white, borderRadius: 15, padding: 14, gap: 10, ...SHADOWS.sm }, sectionTitle: { fontFamily: FONTS.displayBold, fontSize: 16, color: COLORS.dark },
  search: { height: 46, backgroundColor: COLORS.grayLight, borderRadius: 10, paddingHorizontal: 12, fontFamily: FONTS.regular }, result: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  name: { flex: 1, fontFamily: FONTS.semiBold, color: COLORS.dark }, link: { color: COLORS.primary, fontFamily: FONTS.semiBold }, item: { flexDirection: 'row', alignItems: 'center', gap: 9 }, itemName: { flex: 1, fontFamily: FONTS.medium },
  qty: { width: 26, height: 26, textAlign: 'center', lineHeight: 26, backgroundColor: COLORS.grayLight, borderRadius: 6, fontSize: 18 }, remove: { color: COLORS.error, fontSize: 22 }, total: { textAlign: 'right', fontFamily: FONTS.bold, color: COLORS.primary },
  payments: { flexDirection: 'row', gap: 7 }, pay: { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: COLORS.grayLight, alignItems: 'center' }, payActive: { backgroundColor: COLORS.primary }, payText: { color: COLORS.white, fontFamily: FONTS.semiBold },
});
