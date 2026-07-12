import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import PickerField from '../../components/common/PickerField';
import { useServices } from '../../hooks/useServices';
import { clearCart } from '../../store/slices/cartSlice';
import { clearPersistedCart } from '../../services/cartSyncService';

const pick = (source, camelKey, pascalKey) => source?.[camelKey] ?? source?.[pascalKey] ?? '';

const PAYMENT_METHODS = [
  { key: 'COD', label: 'Thanh toán khi nhận hàng', shortLabel: 'COD', icon: 'cash-outline', iconSet: 'ion', color: COLORS.success },
  { key: 'Momo', label: 'Ví MoMo', shortLabel: 'MoMo', icon: 'wallet', iconSet: 'ion', color: '#A50064', comingSoon: true },
  { key: 'VNPay', label: 'VNPAY-QR', shortLabel: 'VNPAY', icon: 'qrcode-scan', iconSet: 'mci', color: '#005BAC', comingSoon: true },
  { key: 'BankTransfer', label: 'Chuyển khoản ngân hàng', shortLabel: 'QR ngân hàng', icon: 'bank-transfer', iconSet: 'mci', color: COLORS.info },
  { key: 'Stripe', label: 'Thẻ Visa/Mastercard', shortLabel: 'Thẻ', icon: 'card-outline', iconSet: 'ion', color: COLORS.dark },
];

const BANK_TRANSFER_INFO = {
  // Đổi sang tài khoản nhận tiền thật của nhà sách trước khi chạy production.
  bankCode: 'VCB',
  accountNo: '0123456789',
  accountName: 'BOOKSTORE APP',
};

const formatMoney = (value) => Number(value || 0).toLocaleString('vi-VN');

const buildQrUrl = ({ method, amount, content }) => {
  const encodedContent = encodeURIComponent(content);

  if (method === 'BankTransfer') {
    return `https://img.vietqr.io/image/${BANK_TRANSFER_INFO.bankCode}-${BANK_TRANSFER_INFO.accountNo}-compact2.png?amount=${amount}&addInfo=${encodedContent}&accountName=${encodeURIComponent(BANK_TRANSFER_INFO.accountName)}`;
  }

  return null;
};

function PaymentIcon({ method, selected }) {
  const iconColor = selected ? COLORS.white : method.color;
  const iconSize = 24;

  if (method.iconSet === 'ion') {
    return <Ionicons name={method.icon} size={iconSize} color={iconColor} />;
  }

  return <MaterialCommunityIcons name={method.icon} size={iconSize} color={iconColor} />;
}

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const { orderService, paymentService, productService, userService } = useServices();
  const { confirmPayment } = useStripe();
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [wardPickerVisible, setWardPickerVisible] = useState(false);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => userService.getMe() });
  const citiesQuery = useQuery({ queryKey: ['cities'], queryFn: () => productService.getCities() });
  const profile = meQuery.data || auth.user || {};

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      recipientName: pick(profile, 'fullName', 'FullName'),
      phoneNumber: pick(profile, 'phoneNumber', 'PhoneNumber'),
      email: pick(profile, 'email', 'Email'),
      cityId: pick(profile, 'cityId', 'CityId') || null,
      wardId: pick(profile, 'wardId', 'WardId') || null,
      shippingAddress: pick(profile, 'address', 'Address'),
      notes: '',
    },
  });

  const selectedCityId = watch('cityId');
  const selectedWardId = watch('wardId');
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

  // Hydrate shipping fields once the richer profile payload arrives from /me.
  useEffect(() => {
    if (!meQuery.data) {
      return;
    }

    reset({
      recipientName: pick(meQuery.data, 'fullName', 'FullName'),
      phoneNumber: pick(meQuery.data, 'phoneNumber', 'PhoneNumber'),
      email: pick(meQuery.data, 'email', 'Email'),
      cityId: pick(meQuery.data, 'cityId', 'CityId') || null,
      wardId: pick(meQuery.data, 'wardId', 'WardId') || null,
      shippingAddress: pick(meQuery.data, 'address', 'Address'),
      notes: '',
    });
  }, [meQuery.data, reset]);

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const checkoutItems = route.params?.items || cart.items;
      const orderPayload = {
        ...values,
        email: auth.user?.email || values.email || '',
        paymentMethod,
        items: checkoutItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? item.price,
        })),
      };

      const order = await orderService.createOrder(orderPayload);

      if (paymentMethod === 'Stripe') {
        const { clientSecret } = await paymentService.createPaymentIntent(order.orderId);
        const { error } = await confirmPayment(clientSecret, { paymentMethodType: 'Card' });
        if (error) {
          throw error;
        }
      }

      dispatch(clearCart());
      await clearPersistedCart({ isGuestCart: cart.isGuestCart, userId: auth.user?.userId });
      navigation.replace('OrderSuccess', { orderId: order.orderId, totalAmount: order.totalAmount, paymentMethod });
    } catch (error) {
      Toast.show({ type: 'error', text1: error?.message || error?.response?.data?.message || 'Không thể đặt hàng' });
    } finally {
      setLoading(false);
    }
  };

  const items = route.params?.items || cart.items;
  const watchedPhoneNumber = watch('phoneNumber');
  const orderTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.unitPrice ?? item.price ?? 0) * Number(item.quantity || 0), 0),
    [items],
  );
  const selectedPaymentMethod = PAYMENT_METHODS.find((method) => method.key === paymentMethod) || PAYMENT_METHODS[0];
  const paymentContent = useMemo(
    () => `BOOKSTORE ${auth.user?.userId || 'KH'} ${String(watchedPhoneNumber || '').replace(/\D/g, '')}`,
    [auth.user?.userId, watchedPhoneNumber],
  );
  const qrUrl = buildQrUrl({ method: paymentMethod, amount: orderTotal, content: paymentContent });
  const isBankTransfer = paymentMethod === 'BankTransfer';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Xác nhận đơn hàng</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
        <Controller control={control} name="recipientName" rules={{ required: 'Vui lòng nhập tên người nhận' }} render={({ field }) => <AppInput label="Họ và tên người nhận" value={field.value} onChangeText={field.onChange} error={errors.recipientName?.message} />} />
        <Controller control={control} name="phoneNumber" rules={{ required: 'Vui lòng nhập số điện thoại' }} render={({ field }) => <AppInput label="Số điện thoại" value={field.value} onChangeText={field.onChange} error={errors.phoneNumber?.message} keyboardType="phone-pad" />} />
        <Controller control={control} name="email" render={({ field }) => <AppInput label="Email" value={field.value} onChangeText={field.onChange} keyboardType="email-address" autoCapitalize="none" />} />
        <PickerField
          label="Tỉnh/Thành phố"
          value={selectedCity?.cityName || pick(profile, 'cityName', 'CityName')}
          placeholder="Chọn tỉnh/thành phố"
          options={cities}
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
          value={selectedWard?.wardName || pick(profile, 'wardName', 'WardName')}
          placeholder="Chọn phường/xã"
          options={wards}
          visible={wardPickerVisible}
          onOpen={() => setWardPickerVisible(true)}
          onClose={() => setWardPickerVisible(false)}
          getLabel={(item) => item.wardName}
          onSelect={(item) => setValue('wardId', item.wardId)}
          disabled={!selectedCityId}
        />
        <Controller control={control} name="shippingAddress" rules={{ required: 'Vui lòng nhập địa chỉ nhận hàng' }} render={({ field }) => <AppInput label="Địa chỉ cụ thể" value={field.value} onChangeText={field.onChange} error={errors.shippingAddress?.message} />} />
        <Controller control={control} name="notes" render={({ field }) => <AppInput label="Ghi chú" value={field.value} onChangeText={field.onChange} multiline numberOfLines={3} />} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sản phẩm ({items.length})</Text>
        <FlatList
          data={items}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.productId)}
          renderItem={({ item }) => <Text style={styles.itemLine}>• {item.productName} x{item.quantity}</Text>}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Thanh toán</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map((method) => {
            const selected = paymentMethod === method.key;
            const disabled = method.comingSoon;

            return (
              <Pressable
                key={method.key}
                onPress={() => {
                  if (!disabled) {
                    setPaymentMethod(method.key);
                  }
                }}
                disabled={disabled}
                style={[
                  styles.paymentOption,
                  selected && { backgroundColor: method.color, borderColor: method.color },
                  disabled && styles.paymentOptionDisabled,
                ]}
              >
                <View style={[styles.paymentIcon, selected && styles.paymentIconActive]}>
                  <PaymentIcon method={method} selected={selected} />
                </View>
                <View style={styles.paymentTextWrap}>
                  <View style={styles.paymentTitleRow}>
                    <Text style={[styles.paymentLabel, selected && styles.paymentLabelActive]} numberOfLines={1}>{method.shortLabel}</Text>
                    {method.comingSoon ? <Text style={styles.comingSoonBadge}>Sắp có</Text> : null}
                  </View>
                  <Text style={[styles.paymentSubLabel, selected && styles.paymentSubLabelActive]} numberOfLines={2}>{method.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {isBankTransfer ? (
          <View style={styles.qrPanel}>
            <View style={styles.qrHeader}>
              <View style={[styles.qrIcon, { backgroundColor: selectedPaymentMethod.color }]}>
                <PaymentIcon method={selectedPaymentMethod} selected />
              </View>
              <View style={styles.qrTitleWrap}>
                <Text style={styles.qrTitle}>{selectedPaymentMethod.label}</Text>
                <Text style={styles.qrSubtitle}>Quét QR hoặc chuyển khoản theo nội dung bên dưới.</Text>
              </View>
            </View>
            <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
            <View style={styles.paymentInfoBox}>
              <Text style={styles.paymentInfoLine}>Ngân hàng: {BANK_TRANSFER_INFO.bankCode}</Text>
              <Text style={styles.paymentInfoLine}>Số tài khoản: {BANK_TRANSFER_INFO.accountNo}</Text>
              <Text style={styles.paymentInfoLine}>Chủ tài khoản: {BANK_TRANSFER_INFO.accountName}</Text>
              <Text style={styles.paymentInfoLine}>Số tiền: {formatMoney(orderTotal)} đ</Text>
              <Text style={styles.paymentInfoLine}>Nội dung: {paymentContent}</Text>
            </View>
            <Text style={styles.qrNote}>Đơn hàng sẽ ở trạng thái chờ xử lý cho đến khi cửa hàng xác nhận thanh toán.</Text>
          </View>
        ) : null}

        {paymentMethod === 'Stripe' ? (
          <View style={styles.cardPaymentPanel}>
            <Text style={styles.qrSubtitle}>Thanh toán thẻ qua Stripe.</Text>
            <CardField postalCodeEnabled={false} placeholders={{ number: '4242 4242 4242 4242' }} cardStyle={styles.cardField} style={styles.cardFieldWrap} />
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.row}><Text style={styles.label}>Tạm tính</Text><Text style={styles.value}>{formatMoney(orderTotal)} đ</Text></View>
        <View style={styles.row}><Text style={styles.label}>Phí ship</Text><Text style={styles.value}>Miễn phí</Text></View>
        <View style={styles.row}><Text style={styles.totalLabel}>Tổng cộng</Text><Text style={styles.totalValue}>{formatMoney(orderTotal)} đ</Text></View>
      </View>

      <AppButton label={`Đặt hàng - ${formatMoney(orderTotal)} đ`} onPress={handleSubmit(onSubmit)} loading={loading} fullWidth />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.dark },
  card: { backgroundColor: COLORS.white, padding: 16, borderRadius: SIZES.radius, ...SHADOWS.sm, gap: 10 },
  sectionTitle: { fontFamily: FONTS.displayBold, fontSize: 16, color: COLORS.dark },
  itemLine: { fontFamily: FONTS.regular, color: COLORS.gray, marginTop: 4 },
  paymentGrid: { gap: 10 },
  paymentOption: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  paymentOptionDisabled: { opacity: 0.55 },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  paymentTextWrap: { flex: 1, minWidth: 0 },
  paymentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paymentLabel: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.dark },
  paymentLabelActive: { color: COLORS.white },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.warning,
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 10,
  },
  paymentSubLabel: { marginTop: 2, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 16, color: COLORS.gray },
  paymentSubLabelActive: { color: COLORS.white },
  qrPanel: { gap: 12, borderRadius: SIZES.radius, backgroundColor: COLORS.grayLight, padding: 12 },
  qrHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qrIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  qrTitleWrap: { flex: 1, minWidth: 0 },
  qrTitle: { fontFamily: FONTS.bold, color: COLORS.dark },
  qrSubtitle: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 17, color: COLORS.gray },
  qrImage: { width: 220, height: 220, alignSelf: 'center', borderRadius: SIZES.radius, backgroundColor: COLORS.white },
  paymentInfoBox: { borderRadius: SIZES.radius, backgroundColor: COLORS.white, padding: 12, gap: 5 },
  paymentInfoLine: { fontFamily: FONTS.medium, color: COLORS.dark, fontSize: 13, lineHeight: 18 },
  qrNote: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 17, color: COLORS.gray },
  cardPaymentPanel: { gap: 10, borderRadius: SIZES.radius, backgroundColor: COLORS.grayLight, padding: 12 },
  cardFieldWrap: { height: 50 },
  cardField: { backgroundColor: COLORS.grayLight, textColor: COLORS.dark, placeholderColor: COLORS.gray },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: FONTS.medium, color: COLORS.gray },
  value: { fontFamily: FONTS.medium, color: COLORS.dark },
  totalLabel: { fontFamily: FONTS.displayBold, color: COLORS.dark },
  totalValue: { fontFamily: FONTS.displayBold, color: COLORS.primary },
});
