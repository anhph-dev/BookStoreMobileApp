import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const FIRESTORE_CART_TIMEOUT_MS = 2500;

const isFirestoreUnavailable = () => !db;

const withTimeout = async (operation, fallback, label) => {
  let timeoutId;

  try {
    return await Promise.race([
      operation,
      new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn(`${label} skipped: Firestore did not respond in time`);
          resolve(fallback);
        }, FIRESTORE_CART_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function loadCart(userId) {
  if (isFirestoreUnavailable()) {
    return [];
  }

  try {
    const snapshot = await withTimeout(
      getDoc(doc(db, 'carts', String(userId))),
      null,
      'Firestore cart load'
    );
    if (!snapshot) {
      return [];
    }

    return snapshot.exists() ? snapshot.data().items || [] : [];
  } catch (error) {
    console.warn('Firestore cart load skipped', error);
    return [];
  }
}

export async function saveCart(userId, items) {
  if (isFirestoreUnavailable()) {
    return;
  }

  try {
    await withTimeout(
      setDoc(doc(db, 'carts', String(userId)), { items, updatedAt: serverTimestamp() }, { merge: true }),
      undefined,
      'Firestore cart save'
    );
  } catch (error) {
    console.warn('Firestore cart save skipped', error);
  }
}

export async function clearCart(userId) {
  if (isFirestoreUnavailable()) {
    return;
  }

  try {
    await withTimeout(
      setDoc(doc(db, 'carts', String(userId)), { items: [], updatedAt: serverTimestamp() }, { merge: true }),
      undefined,
      'Firestore cart clear'
    );
  } catch (error) {
    console.warn('Firestore cart clear skipped', error);
  }
}
