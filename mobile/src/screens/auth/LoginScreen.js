import React, { useCallback, useMemo, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS } from '../../constants/theme';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import { setCredentials } from '../../store/slices/authSlice';
import { mergeCartOnLogin } from '../../services/cartSyncService';
import { useServices } from '../../hooks/useServices';

export default function LoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { authService } = useServices();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const returnTo = route.params?.returnTo;

  const goToHome = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'HomeTab' } }] });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        // Giữ khách trong app khi bấm back từ màn đăng nhập.
        goToHome();
        return true;
      });

      return () => subscription.remove();
    }, [goToHome]),
  );

  const title = useMemo(() => 'Đăng nhập', []);
  const handlePostLoginNavigation = (target) => {
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

  const onSubmit = async (values) => {
    try {
      const response = await authService.login(values);
      dispatch(setCredentials(response));

      try {
        await mergeCartOnLogin(response.user.userId, dispatch);
      } catch (cartError) {
        console.warn('Failed to merge cart after login', cartError);
      }

      handlePostLoginNavigation(returnTo);
    } catch (error) {
      const message = error?.response?.data?.message || 'Không thể đăng nhập';
      Toast.show({ type: 'error', text1: message });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.brand}>BookStore</Text>
          <Text style={styles.heroText}>Mua sách dễ dàng, nhanh gọn.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Chào mừng trở lại!</Text>

          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Vui lòng nhập email',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' },
            }}
            render={({ field: { value, onChange, onBlur } }) => (
              <AppInput label="Email" leftIcon="mail-outline" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: 'Vui lòng nhập mật khẩu', minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' } }}
            render={({ field: { value, onChange, onBlur } }) => (
              <AppInput
                label="Mật khẩu"
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                onRightIconPress={() => setShowPassword((current) => !current)}
              />
            )}
          />

          <AppButton label="Đăng nhập" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />

          <TouchableOpacity onPress={() => navigation.navigate('Register', { returnTo })} style={styles.linkRow}>
            <Text style={styles.link}>Chưa có tài khoản? Đăng ký ngay</Text>
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
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 12,
  },
  title: { fontFamily: FONTS.displayBold, fontSize: 24, color: COLORS.dark },
  subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, marginBottom: 4 },
  linkRow: { alignItems: 'center', paddingVertical: 12 },
  link: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.primary },
});
