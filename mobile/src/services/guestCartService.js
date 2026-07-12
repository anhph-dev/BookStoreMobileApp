import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bookstore_guest_cart';

export async function getGuestCart() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveGuestCart(items) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function clearGuestCart() {
  await AsyncStorage.removeItem(KEY);
}
