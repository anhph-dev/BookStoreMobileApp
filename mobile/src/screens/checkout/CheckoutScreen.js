import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import { useServices } from '../../hooks/useServices';
import { clearCart } from '../../store/slices/cartSlice';
import { clearPersistedCart } from '../../services/cartSyncService';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const { orderService, paymentService } = useServices();
  const { confirmPayment } = useStripe();
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      recipientName: auth.user?.fullName || '',
      phoneNumber: auth.user?.phoneNumber || '',
      shippingAddress: auth.user?.address || '',
      notes: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const orderPayload = {
        ...values,
        paymentMethod,
        items: route.params?.items || cart.items,
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Xác nhận đơn hàng</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
        <Controller control={control} name="recipientName" rules={{ required: 'Vui lòng nhập tên người nhận' }} render={({ field }) => <AppInput label="Họ và tên người nhận" value={field.value} onChangeText={field.onChange} error={errors.recipientName?.message} />} />
        <Controller control={control} name="phoneNumber" rules={{ required: 'Vui lòng nhập số điện thoại' }} render={({ field }) => <AppInput label="Số điện thoại" value={field.value} onChangeText={field.onChange} error={errors.phoneNumber?.message} keyboardType="phone-pad" />} />
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
        {['COD', 'BankTransfer', 'Stripe'].map((method) => (
          <Text key={method} onPress={() => setPaymentMethod(method)} style={[styles.option, paymentMethod === method && styles.optionActive]}>
            {method === 'COD' ? 'Thanh toán khi nhận hàng' : method === 'BankTransfer' ? 'Chuyển khoản' : 'Thẻ quốc tế (Stripe)'}
          </Text>
        ))}
        {paymentMethod === 'Stripe' ? <CardField postalCodeEnabled={false} placeholders={{ number: '4242 4242 4242 4242' }} cardStyle={styles.cardField} style={styles.cardFieldWrap} /> : null}
      </View>

      <View style={styles.card}>
        <View style={styles.row}><Text style={styles.label}>Tạm tính</Text><Text style={styles.value}>{cart.totalAmount.toLocaleString('vi-VN')} đ</Text></View>
        <View style={styles.row}><Text style={styles.label}>Phí ship</Text><Text style={styles.value}>Miễn phí</Text></View>
        <View style={styles.row}><Text style={styles.totalLabel}>Tổng cộng</Text><Text style={styles.totalValue}>{cart.totalAmount.toLocaleString('vi-VN')} đ</Text></View>
      </View>

      <AppButton label={`Đặt hàng — ${cart.totalAmount.toLocaleString('vi-VN')} đ`} onPress={handleSubmit(onSubmit)} loading={loading} fullWidth />
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
  option: { fontFamily: FONTS.medium, paddingVertical: 10, paddingHorizontal: 12, borderRadius: SIZES.radius, backgroundColor: COLORS.grayLight, marginTop: 8 },
  optionActive: { backgroundColor: COLORS.primaryLight, color: COLORS.primary },
  cardFieldWrap: { height: 50, marginTop: 10 },
  cardField: { backgroundColor: COLORS.grayLight, textColor: COLORS.dark, placeholderColor: COLORS.gray },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: FONTS.medium, color: COLORS.gray },
  value: { fontFamily: FONTS.medium, color: COLORS.dark },
  totalLabel: { fontFamily: FONTS.displayBold, color: COLORS.dark },
  totalValue: { fontFamily: FONTS.displayBold, color: COLORS.primary },
});
