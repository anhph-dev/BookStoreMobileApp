import { clearGuestCart, getGuestCart } from './guestCartService';
import { clearCart as clearFirestoreCart, loadCart as loadFirestoreCart, saveCart as saveFirestoreCart } from './firestoreCartService';
import { loadCart, setGuestCart } from '../store/slices/cartSlice';
import { mergeItems } from '../utils/cartMerge';

export async function mergeCartOnLogin(userId, dispatch) {
  const guestItems = await getGuestCart();
  const firestoreItems = await loadFirestoreCart(userId);
  const merged = mergeItems(guestItems, firestoreItems);

  dispatch(loadCart(merged));
  dispatch(setGuestCart(false));

  await saveFirestoreCart(userId, merged);
  await clearGuestCart();

  return merged;
}

export async function persistCartAfterMutation({ isGuestCart, userId, items }) {
  if (isGuestCart) {
    // Guest mode persists locally so the user never loses the cart before login.
    const { saveGuestCart } = await import('./guestCartService');
    await saveGuestCart(items);
    return;
  }

  if (userId) {
    await saveFirestoreCart(userId, items);
  }
}

export async function clearPersistedCart({ isGuestCart, userId }) {
  if (isGuestCart) {
    await clearGuestCart();
    return;
  }

  if (userId) {
    await clearFirestoreCart(userId);
  }
}
