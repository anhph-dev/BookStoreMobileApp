import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SHADOWS, SIZES } from '../../constants/theme';
import CartItem from '../../components/cart/CartItem';
import EmptyState from '../../components/common/EmptyState';
import AppButton from '../../components/common/AppButton';
import { removeItem, updateQuantity } from '../../store/slices/cartSlice';
import { persistCartAfterMutation } from '../../services/cartSyncService';

export default function CartScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const handleCheckout = async () => {
    if (!auth.isLoggedIn) {
      setLoginModalVisible(true);
      return;
    }

    navigation.navigate('Checkout', { items: cart.items });
  };

  const handleRemove = async (productId) => {
    dispatch(removeItem(productId));
    const nextItems = cart.items.filter((item) => item.productId !== productId);
    await persistCartAfterMutation({ isGuestCart: cart.isGuestCart, userId: auth.user?.userId, items: nextItems });
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    const nextQuantity = Math.max(1, quantity);
    dispatch(updateQuantity({ productId, quantity: nextQuantity }));
    const nextItems = cart.items.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item));
    await persistCartAfterMutation({ isGuestCart: cart.isGuestCart, userId: auth.user?.userId, items: nextItems });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Giỏ hàng của tôi</Text>
        <Text style={styles.subtitle}>{cart.totalCount} sản phẩm</Text>
      </View>

      {cart.isGuestCart ? (
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.noticeText}>Đăng nhập để lưu giỏ hàng và đặt hàng.</Text>
        </View>
      ) : null}

      {cart.items.length === 0 ? (
        <EmptyState icon="cart-outline" title="Giỏ hàng trống" subtitle="Thêm sách yêu thích vào giỏ nào!" actionLabel="Khám phá sách" onAction={() => navigation.navigate('HomeTab')} />
      ) : (
        <FlatList
          data={cart.items}
          keyExtractor={(item) => String(item.productId)}
          renderItem={({ item }) => (
            <CartItem
              item={item}
              onIncrease={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
              onDecrease={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
              onDelete={() => handleRemove(item.productId)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 180 }}
        />
      )}

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tổng cộng</Text><Text style={styles.summaryValue}>{cart.totalAmount.toLocaleString('vi-VN')} đ</Text></View>
        <AppButton label={auth.isLoggedIn ? `Tiến hành đặt hàng (${cart.totalCount})` : 'Đăng nhập để đặt hàng'} onPress={handleCheckout} fullWidth disabled={cart.items.length === 0} />
      </View>

      <Modal transparent visible={loginModalVisible} animationType="slide" onRequestClose={() => setLoginModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLoginModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.handle} />
            <Ionicons name="cart-outline" size={40} color={COLORS.primary} style={{ alignSelf: 'center' }} />
            <Text style={styles.modalTitle}>Đăng nhập để tiếp tục</Text>
            <Text style={styles.modalText}>Giỏ hàng của bạn sẽ được giữ nguyên sau khi đăng nhập.</Text>
            <AppButton label="Đăng nhập" onPress={() => navigation.navigate('Login', { returnTo: 'Checkout' })} fullWidth />
            <AppButton label="Đăng ký" onPress={() => navigation.navigate('Register', { returnTo: 'Checkout' })} variant="outline" fullWidth />
            <Pressable onPress={() => setLoginModalVisible(false)} style={styles.textButton}><Text style={styles.textButtonLabel}>Để sau</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.dark },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.gray, marginTop: 4 },
  notice: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: SIZES.radius },
  noticeText: { fontFamily: FONTS.medium, color: COLORS.dark, flex: 1 },
  summaryCard: { position: 'absolute', left: 16, right: 16, bottom: 16, padding: 16, backgroundColor: COLORS.white, borderRadius: SIZES.radius, ...SHADOWS.md, gap: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: FONTS.medium, color: COLORS.gray },
  summaryValue: { fontFamily: FONTS.displayBold, color: COLORS.primary },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.25)' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  handle: { width: 48, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center' },
  modalTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.dark, textAlign: 'center' },
  modalText: { fontFamily: FONTS.regular, color: COLORS.gray, textAlign: 'center' },
  textButton: { alignItems: 'center', paddingVertical: 8 },
  textButtonLabel: { fontFamily: FONTS.medium, color: COLORS.primary },
});
