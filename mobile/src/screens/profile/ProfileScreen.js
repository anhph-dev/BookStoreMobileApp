import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import { clearCart } from '../../store/slices/cartSlice';
import { logout, updateUser } from '../../store/slices/authSlice';
import { clearPersistedCart } from '../../services/cartSyncService';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const auth = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  const { userService } = useServices();
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => userService.getMe() });

  const updateForm = useForm({ defaultValues: { fullName: auth.user?.fullName || '', phoneNumber: auth.user?.phoneNumber || '', address: auth.user?.address || '' } });
  const passwordForm = useForm({ defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' } });

  const saveMutation = useMutation({
    mutationFn: (values) => userService.updateMe(values),
    onSuccess: async (result) => {
      dispatch(updateUser(result.user));
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      Toast.show({ type: 'success', text1: result.message });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (values) => userService.updatePassword(values),
    onSuccess: (result) => Toast.show({ type: 'success', text1: result.message }),
  });

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await clearPersistedCart({ isGuestCart: cart.isGuestCart, userId: auth.user?.userId });
          dispatch(logout());
          dispatch(clearCart());
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(auth.user?.fullName || 'U').charAt(0).toUpperCase()}</Text></View>
        <Text style={styles.name}>{auth.user?.fullName || 'Người dùng'}</Text>
        <Text style={styles.email}>{auth.user?.email || ''}</Text>
      </View>

      <View style={styles.card}>
        <Pressable onPress={() => setShowEdit((current) => !current)} style={styles.row}><Text style={styles.section}>Thông tin cá nhân</Text><Ionicons name={showEdit ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray} /></Pressable>
        {showEdit ? (
          <>
            <Controller control={updateForm.control} name="fullName" render={({ field }) => <AppInput label="Họ và tên" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={updateForm.control} name="phoneNumber" render={({ field }) => <AppInput label="Số điện thoại" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={updateForm.control} name="address" render={({ field }) => <AppInput label="Địa chỉ" value={field.value} onChangeText={field.onChange} />} />
            <AppButton label="Lưu thay đổi" onPress={updateForm.handleSubmit((values) => saveMutation.mutate(values))} loading={saveMutation.isPending} fullWidth />
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.row}><Text style={styles.section}>Đổi mật khẩu</Text><Ionicons name={showPassword ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray} /></Pressable>
        {showPassword ? (
          <>
            <Controller control={passwordForm.control} name="oldPassword" render={({ field }) => <AppInput label="Mật khẩu hiện tại" secureTextEntry value={field.value} onChangeText={field.onChange} />} />
            <Controller control={passwordForm.control} name="newPassword" render={({ field }) => <AppInput label="Mật khẩu mới" secureTextEntry value={field.value} onChangeText={field.onChange} />} />
            <Controller control={passwordForm.control} name="confirmPassword" rules={{ validate: (value) => value === passwordForm.watch('newPassword') || 'Mật khẩu không khớp' }} render={({ field }) => <AppInput label="Xác nhận mật khẩu mới" secureTextEntry value={field.value} onChangeText={field.onChange} />} />
            <AppButton label="Đổi mật khẩu" onPress={passwordForm.handleSubmit((values) => passwordMutation.mutate(values))} loading={passwordMutation.isPending} variant="outline" fullWidth />
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable onPress={() => navigation.navigate('OrderHistory')} style={styles.menuRow}><Ionicons name="receipt-outline" size={18} color={COLORS.primary} /><Text style={styles.menuText}>Lịch sử đơn hàng</Text></Pressable>
        {(auth.user?.role === 'Admin' || auth.user?.role === 'NVKho') ? <Pressable onPress={() => navigation.navigate('ProductManage')} style={styles.menuRow}><Ionicons name="cube-outline" size={18} color={COLORS.primary} /><Text style={styles.menuText}>Quản lý sản phẩm</Text></Pressable> : null}
        <Pressable onPress={handleLogout} style={styles.menuRow}><Ionicons name="log-out-outline" size={18} color={COLORS.error} /><Text style={[styles.menuText, { color: COLORS.error }]}>Đăng xuất</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  headerCard: { backgroundColor: COLORS.primary, padding: 24, borderRadius: 24, alignItems: 'center', gap: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONTS.displayBold, fontSize: 24, color: COLORS.primary },
  name: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.white },
  email: { fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.9)' },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16, gap: 10, ...SHADOWS.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontFamily: FONTS.displayBold, color: COLORS.dark },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  menuText: { fontFamily: FONTS.medium, color: COLORS.dark },
});
