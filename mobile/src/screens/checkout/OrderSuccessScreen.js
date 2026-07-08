import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SIZES } from '../../constants/theme';
import AppButton from '../../components/common/AppButton';

export default function OrderSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const orderId = route.params?.orderId;
  const totalAmount = route.params?.totalAmount || 0;
  const paymentMethod = route.params?.paymentMethod || 'COD';

  return (
    <View style={styles.container}>
      <View style={styles.checkWrap}><Ionicons name="checkmark" size={42} color={COLORS.white} /></View>
      <Text style={styles.title}>Đặt hàng thành công!</Text>
      <Text style={styles.subtitle}>Mã đơn hàng: #{orderId}</Text>
      <View style={styles.card}>
        <Text style={styles.row}>Tổng tiền: {Number(totalAmount).toLocaleString('vi-VN')} đ</Text>
        <Text style={styles.row}>Phương thức: {paymentMethod}</Text>
        <Text style={styles.row}>Trạng thái: Chờ xử lý</Text>
      </View>
      <View style={styles.actions}>
        <AppButton label="Xem đơn hàng" onPress={() => navigation.navigate('OrderDetail', { orderId })} variant="outline" fullWidth />
        <AppButton label="Về trang chủ" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: COLORS.white, gap: 12 },
  checkWrap: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success },
  title: { fontFamily: FONTS.displayBold, fontSize: 24, color: COLORS.dark },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.gray },
  card: { width: '100%', backgroundColor: COLORS.grayLight, borderRadius: SIZES.radius, padding: 16, gap: 8 },
  row: { fontFamily: FONTS.medium, color: COLORS.dark },
  actions: { width: '100%', gap: 10 },
});
