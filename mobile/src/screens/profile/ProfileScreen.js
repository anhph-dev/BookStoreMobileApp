import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import { useServices } from '../../hooks/useServices';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import PickerField from '../../components/common/PickerField';
import { clearCart, setGuestCart } from '../../store/slices/cartSlice';
import { logout, updateUser } from '../../store/slices/authSlice';
import { clearPersistedCart } from '../../services/cartSyncService';
import { unregisterPushNotifications } from '../../services/notificationService';

const pick = (source, camelKey, pascalKey) => source?.[camelKey] ?? source?.[pascalKey] ?? '';

const getProfileFormValues = (source) => ({
  fullName: pick(source, 'fullName', 'FullName'),
  phoneNumber: pick(source, 'phoneNumber', 'PhoneNumber'),
  address: pick(source, 'address', 'Address'),
  cityId: pick(source, 'cityId', 'CityId') || null,
  wardId: pick(source, 'wardId', 'WardId') || null,
  profileImageUrl: pick(source, 'profileImageUrl', 'ProfileImageUrl') || null,
});

export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const auth = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  const { productService, userService } = useServices();
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [wardPickerVisible, setWardPickerVisible] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => userService.getMe() });
  const citiesQuery = useQuery({ queryKey: ['cities'], queryFn: () => productService.getCities() });
  const profile = meQuery.data || auth.user || {};

  const updateForm = useForm({
    defaultValues: getProfileFormValues(profile),
  });
  const passwordForm = useForm({ defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' } });

  const selectedCityId = updateForm.watch('cityId');
  const selectedWardId = updateForm.watch('wardId');
  const cities = citiesQuery.data || [];
  const wardsQuery = useQuery({
    queryKey: ['wards', selectedCityId],
    queryFn: () => productService.getWards(selectedCityId),
    enabled: Boolean(selectedCityId),
  });
  const wards = wardsQuery.data || [];

  const selectedCity = useMemo(
    () => cities.find((city) => city.cityId === selectedCityId),
    [cities, selectedCityId],
  );
  const selectedWard = useMemo(
    () => wards.find((ward) => ward.wardId === selectedWardId),
    [wards, selectedWardId],
  );

  // Đồng bộ form khi /me trả về đủ thông tin địa chỉ hơn auth state.
  useEffect(() => {
    if (!meQuery.data) {
      return;
    }

    updateForm.reset(getProfileFormValues(meQuery.data));
  }, [meQuery.data, updateForm]);

  const saveMutation = useMutation({
    mutationFn: (values) => userService.updateMe(values),
    onSuccess: async (result) => {
      dispatch(updateUser(result.user));
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      Toast.show({ type: 'success', text1: result.message });
      setShowEdit(false);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (values) => userService.updatePassword(values),
    onSuccess: (result) => {
      passwordForm.reset();
      Toast.show({ type: 'success', text1: result.message });
    },
  });

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          const userId = auth.user?.userId;
          const isGuestCart = cart.isGuestCart;

          try {
            await unregisterPushNotifications();
          } catch (error) {
            console.warn('Push token cleanup failed', error);
          }

          dispatch(logout());
          dispatch(clearCart());
          dispatch(setGuestCart(true));

          clearPersistedCart({ isGuestCart, userId }).catch((error) => console.warn('Logout cart cleanup skipped', error));

          // Sau đăng xuất, đưa khách về trang sách thay vì kẹt ở stack đăng nhập.
          navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'HomeTab' } }] });
        },
      },
    ]);
  };

  const cityName = pick(profile, 'cityName', 'CityName') || selectedCity?.cityName || 'Chưa cập nhật';
  const wardName = pick(profile, 'wardName', 'WardName') || selectedWard?.wardName || 'Chưa cập nhật';
  const fullName = pick(profile, 'fullName', 'FullName') || 'Người dùng';
  const email = pick(profile, 'email', 'Email') || '';
  const profileImageUrl = pick(profile, 'profileImageUrl', 'ProfileImageUrl') || updateForm.watch('profileImageUrl');

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: 'Cần cấp quyền truy cập ảnh' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      setAvatarUploading(true);
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName || `profile-${auth.user?.userId || 'user'}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };

      // Upload avatar qua backend Admin SDK để tránh lỗi rule Firebase Storage phía client.
      const saveResult = await userService.updateAvatar(file);
      updateForm.setValue('profileImageUrl', pick(saveResult.user, 'profileImageUrl', 'ProfileImageUrl'));
      dispatch(updateUser(saveResult.user));
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      Toast.show({ type: 'success', text1: 'Đã cập nhật ảnh đại diện' });
    } catch (error) {
      console.warn('Avatar upload failed', error);
      Toast.show({ type: 'error', text1: 'Không thể cập nhật ảnh đại diện' });
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Pressable onPress={handlePickAvatar} style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
            )}
            {avatarUploading ? <View style={styles.avatarLoading}><ActivityIndicator color={COLORS.white} /></View> : null}
          </View>
          <View style={styles.avatarEdit}>
            <Ionicons name="pencil" size={14} color={COLORS.white} />
          </View>
        </Pressable>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.section}>Thông tin cá nhân</Text>
          <Pressable onPress={() => setShowEdit((current) => !current)} style={styles.editIconButton}>
            <Ionicons name={showEdit ? 'close-outline' : 'pencil-outline'} size={18} color={COLORS.primary} />
          </Pressable>
        </View>

        {showEdit ? (
          <>
            <Controller control={updateForm.control} name="fullName" render={({ field }) => <AppInput label="Họ và tên" value={field.value} onChangeText={field.onChange} />} />
            <Controller control={updateForm.control} name="phoneNumber" render={({ field }) => <AppInput label="Số điện thoại" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" />} />
            <PickerField
              label="Thành phố"
              value={selectedCity?.cityName || pick(profile, 'cityName', 'CityName')}
              placeholder="Chọn tỉnh/thành phố"
              options={cities}
              visible={cityPickerVisible}
              onOpen={() => setCityPickerVisible(true)}
              onClose={() => setCityPickerVisible(false)}
              getLabel={(item) => item.cityName}
              onSelect={(item) => {
                updateForm.setValue('cityId', item.cityId);
                updateForm.setValue('wardId', null);
              }}
            />
            <PickerField
              label="Phường/Xã"
              value={selectedWard?.wardName || pick(profile, 'wardName', 'WardName')}
              placeholder="Chọn phường/xã"
              options={wards}
              visible={wardPickerVisible}
              onOpen={() => setWardPickerVisible(true)}
              onClose={() => setWardPickerVisible(false)}
              getLabel={(item) => item.wardName}
              onSelect={(item) => updateForm.setValue('wardId', item.wardId)}
              disabled={!selectedCityId}
            />
            <Controller control={updateForm.control} name="address" render={({ field }) => <AppInput label="Địa chỉ cụ thể" value={field.value} onChangeText={field.onChange} />} />
            <View style={styles.formActions}>
              <View style={styles.formAction}>
                <AppButton
                  label="Hủy"
                  onPress={() => {
                    updateForm.reset(getProfileFormValues(profile));
                    setShowEdit(false);
                  }}
                  variant="outline"
                  fullWidth
                />
              </View>
              <View style={styles.formAction}>
                <AppButton label="Lưu" onPress={updateForm.handleSubmit((values) => saveMutation.mutate(values))} loading={saveMutation.isPending} fullWidth />
              </View>
            </View>
          </>
        ) : (
          <>
            <InfoRow icon="call-outline" label="Số điện thoại" value={pick(profile, 'phoneNumber', 'PhoneNumber') || 'Chưa cập nhật'} />
            <InfoRow icon="location-outline" label="Địa chỉ" value={pick(profile, 'address', 'Address') || 'Chưa cập nhật'} />
            <InfoRow icon="business-outline" label="Thành phố" value={cityName} />
            <InfoRow icon="map-outline" label="Phường/Xã" value={wardName} />
          </>
        )}
      </View>

      <View style={styles.card}>
        <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.row}>
          <Text style={styles.section}>Đổi mật khẩu</Text>
          <Ionicons name={showPassword ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray} />
        </Pressable>
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

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 16, gap: 12 },
  headerCard: { backgroundColor: COLORS.primary, padding: 24, borderRadius: 24, alignItems: 'center', gap: 8 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarLoading: { ...StyleSheet.absoluteFillObject, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  avatarEdit: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.dark, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  avatarText: { fontFamily: FONTS.displayBold, fontSize: 24, color: COLORS.primary },
  name: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.white },
  email: { fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.9)' },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16, gap: 10, ...SHADOWS.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editIconButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  section: { fontFamily: FONTS.displayBold, color: COLORS.dark },
  formActions: { flexDirection: 'row', gap: 10 },
  formAction: { flex: 1 },
  infoRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  infoContent: { flex: 1, minWidth: 0 },
  infoLabel: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 12 },
  infoValue: { fontFamily: FONTS.medium, color: COLORS.dark, marginTop: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  menuText: { fontFamily: FONTS.medium, color: COLORS.dark },
});
