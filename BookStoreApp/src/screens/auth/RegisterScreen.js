import React, { useCallback, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { COLORS, FONTS } from '../../constants/theme';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import PickerField from '../../components/common/PickerField';
import { setCredentials } from '../../store/slices/authSlice';
import { mergeCartOnLogin } from '../../services/cartSyncService';
import { useServices } from '../../hooks/useServices';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { authService, productService } = useServices();
  const [showPassword, setShowPassword] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [wardPickerVisible, setWardPickerVisible] = useState(false);
  const returnTo = route.params?.returnTo;
  const goToHome = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'HomeTab' } }] });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        // Giữ khách trong app khi bấm back từ màn đăng ký.
        goToHome();
        return true;
      });

      return () => subscription.remove();
    }, [goToHome]),
  );

  const handlePostAuthNavigation = (target) => {
    const tabRoutes = ['HomeTab', 'SearchTab', 'CartTab', 'OrderTab', 'ProfileTab'];

    if (tabRoutes.includes(target)) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main', params: { screen: target } }],
      });
      return;
    }

    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    if (target) {
      navigation.navigate(target);
    }
  };

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', phoneNumber: '', address: '', cityId: null, wardId: null },
  });

  const citiesQuery = useQuery({
    queryKey: ['cities'],
    queryFn: () => productService.getCities(),
  });

  const selectedCityId = watch('cityId');
  const wardsQuery = useQuery({
    queryKey: ['wards', selectedCityId],
    queryFn: () => productService.getWards(selectedCityId),
    enabled: Boolean(selectedCityId),
  });

  const onSubmit = async (values) => {
    try {
      await authService.register(values);
      const loginResult = await authService.login({ email: values.email, password: values.password });
      dispatch(setCredentials(loginResult));
      try {
        await mergeCartOnLogin(loginResult.user.userId, dispatch);
      } catch (cartError) {
        console.warn('Failed to merge cart after register login', cartError);
      }
      handlePostAuthNavigation(returnTo);
    } catch (error) {
      const message = error?.response?.data?.message || 'Không thể đăng ký';
      Toast.show({ type: 'error', text1: message });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.brand}>BookStore</Text>
          <Text style={styles.heroText}>Tạo tài khoản để lưu giỏ hàng và theo dõi đơn.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản mới</Text>

          <Controller control={control} name="fullName" rules={{ required: 'Vui lòng nhập họ tên' }} render={({ field: { value, onChange, onBlur } }) => <AppInput label="Họ và tên" leftIcon="person-outline" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.fullName?.message} />} />
          <Controller control={control} name="email" rules={{ required: 'Vui lòng nhập email', pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' } }} render={({ field: { value, onChange, onBlur } }) => <AppInput label="Email" leftIcon="mail-outline" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />} />
          <Controller control={control} name="password" rules={{ required: 'Vui lòng nhập mật khẩu', minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' } }} render={({ field: { value, onChange, onBlur } }) => <AppInput label="Mật khẩu" leftIcon="lock-closed-outline" rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'} secureTextEntry={!showPassword} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} onRightIconPress={() => setShowPassword((current) => !current)} />} />
          <Controller control={control} name="confirmPassword" rules={{ validate: (value) => value === watch('password') || 'Mật khẩu xác nhận không khớp' }} render={({ field: { value, onChange, onBlur } }) => <AppInput label="Xác nhận mật khẩu" leftIcon="lock-closed-outline" rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'} secureTextEntry={!showPassword} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} onRightIconPress={() => setShowPassword((current) => !current)} />} />
          <Controller control={control} name="phoneNumber" rules={{ required: 'Vui lòng nhập số điện thoại' }} render={({ field: { value, onChange, onBlur } }) => <AppInput label="Số điện thoại" leftIcon="call-outline" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phoneNumber?.message} keyboardType="phone-pad" />} />
          <Controller control={control} name="address" rules={{ required: 'Vui lòng nhập địa chỉ cụ thể' }} render={({ field: { value, onChange, onBlur } }) => <AppInput label="Địa chỉ cụ thể" leftIcon="location-outline" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.address?.message} />} />

          <PickerField
            label="Tỉnh/Thành phố"
            value={citiesQuery.data?.find((city) => city.cityId === watch('cityId'))?.cityName}
            placeholder="Chọn tỉnh/thành phố (tùy chọn)"
            options={citiesQuery.data || []}
            visible={cityPickerVisible}
            onOpen={() => setCityPickerVisible(true)}
            onClose={() => setCityPickerVisible(false)}
            getLabel={(item) => item.cityName}
            onSelect={(item) => {
              setValue('cityId', item.cityId);
              setValue('wardId', null);
            }}
          />
          <PickerField
            label="Phường/Xã"
            value={wardsQuery.data?.find((ward) => ward.wardId === watch('wardId'))?.wardName}
            placeholder="Chọn phường/xã (tùy chọn)"
            options={wardsQuery.data || []}
            visible={wardPickerVisible}
            onOpen={() => setWardPickerVisible(true)}
            onClose={() => setWardPickerVisible(false)}
            getLabel={(item) => item.wardName}
            onSelect={(item) => setValue('wardId', item.wardId)}
            disabled={!selectedCityId}
          />

          <AppButton label="Đăng ký" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />

          <TouchableOpacity onPress={() => navigation.navigate('Login', { returnTo })} style={styles.linkRow}>
            <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToHome} style={styles.linkRow}>
            <Text style={styles.link}>Xem sách trước</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  hero: { paddingTop: 72, paddingHorizontal: 24, paddingBottom: 36 },
  brand: { fontFamily: FONTS.displayExtraBold, fontSize: 34, color: COLORS.white },
  heroText: { marginTop: 8, fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  card: { flex: 1, backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12 },
  title: { fontFamily: FONTS.displayBold, fontSize: 24, color: COLORS.dark },
  subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, marginBottom: 4 },
  linkRow: { alignItems: 'center', paddingVertical: 12 },
  link: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.primary },
});
