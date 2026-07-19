import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import { formatCurrency } from '../../utils/formatters';

const initials = (name) => String(name || '?').split(/\s+/).slice(-2).map((x) => x[0]).join('').toUpperCase();
export default function CustomerManageScreen() {
  const navigation = useNavigation();
  const { adminService } = useServices();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const id = setTimeout(() => { setSearch(input.trim()); setPage(1); }, 500); return () => clearTimeout(id); }, [input]);
  const query = useQuery({ queryKey: ['customers', search, page], queryFn: () => adminService.getCustomers({ search, page, limit: 20 }) });
  return <View style={styles.container}><Text style={styles.title}>Quản lý khách hàng</Text>
    <View style={styles.search}><Ionicons name="search" size={18} color={COLORS.gray} /><TextInput value={input} onChangeText={setInput} placeholder="Tìm tên, email hoặc SĐT" style={styles.input} /></View>
    <FlatList data={query.data?.customers || []} keyExtractor={(x) => String(x.UserId)} refreshing={query.isFetching} onRefresh={query.refetch}
      contentContainerStyle={styles.list} onEndReached={() => page < (query.data?.totalPages || 1) && setPage(page + 1)}
      renderItem={({ item }) => <Pressable style={styles.card} onPress={() => navigation.navigate('CustomerDetail', { customerId: item.UserId })}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.FullName)}</Text></View><View style={styles.main}>
          <Text style={styles.name}>{item.FullName}</Text><Text style={styles.meta}>{item.Email}</Text>
          <Text style={styles.meta}>{item.PhoneNumber || '—'}  ·  {item.totalOrders} đơn  ·  {formatCurrency(item.totalSpent)} đ</Text>
        </View><View style={styles.right}><Text style={[styles.badge, { backgroundColor: item.IsLocked ? COLORS.error : COLORS.success }]}>{item.IsLocked ? 'Đang khóa' : 'Hoạt động'}</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.gray} /></View></Pressable>} />
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight }, title: { fontFamily: FONTS.displayExtraBold, fontSize: 22, padding: 16, color: COLORS.dark },
  search: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, height: 48, fontFamily: FONTS.regular }, list: { padding: 16, gap: 10 }, card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, ...SHADOWS.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: COLORS.white, fontFamily: FONTS.bold },
  main: { flex: 1, gap: 3 }, name: { fontFamily: FONTS.semiBold, color: COLORS.dark, fontSize: 14 }, meta: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 11 },
  right: { alignItems: 'flex-end', gap: 8 }, badge: { color: COLORS.white, fontFamily: FONTS.medium, fontSize: 10, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
});
