import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';

const initials = (name) => String(name || '?').split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

export default function SaleCustomerSearchScreen() {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const { adminService } = useServices();
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 350);
    return () => clearTimeout(timer);
  }, [input]);
  const query = useQuery({
    queryKey: ['sale-customer-directory', search],
    queryFn: () => adminService.searchSaleCustomers({ search }),
    enabled: search.length >= 2,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tra cứu khách hàng</Text>
        <Text style={styles.subtitle}>Tìm thông tin để hỗ trợ tạo đơn tại quầy</Text>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color={COLORS.gray} />
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Nhập tên, email hoặc SĐT"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>
      <FlatList
        data={query.data?.customers || []}
        keyExtractor={(item) => String(item.UserId)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={44} color={COLORS.border} />
            <Text style={styles.emptyText}>{search.length < 2 ? 'Nhập ít nhất 2 ký tự để tìm kiếm' : 'Không tìm thấy khách hàng'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.FullName)}</Text></View>
            <View style={styles.main}>
              <Text style={styles.name}>{item.FullName}</Text>
              <Text style={styles.meta}>{item.PhoneNumber || 'Chưa có số điện thoại'}</Text>
              <Text style={styles.meta}>{item.Email}</Text>
              {item.Address ? <Text style={styles.address} numberOfLines={2}>{item.Address}</Text> : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  header: { padding: 16, paddingBottom: 10 },
  title: { fontFamily: FONTS.displayExtraBold, fontSize: 22, color: COLORS.dark },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.gray, marginTop: 3 },
  searchBox: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, height: 46, fontFamily: FONTS.regular, color: COLORS.dark },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  empty: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { color: COLORS.gray, fontFamily: FONTS.medium, textAlign: 'center' },
  card: { flexDirection: 'row', gap: 11, backgroundColor: COLORS.white, borderRadius: 14, padding: 13, ...SHADOWS.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontFamily: FONTS.bold },
  main: { flex: 1, gap: 2 },
  name: { fontFamily: FONTS.semiBold, color: COLORS.dark },
  meta: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12 },
  address: { fontFamily: FONTS.regular, color: COLORS.dark, fontSize: 12, marginTop: 3 },
});
