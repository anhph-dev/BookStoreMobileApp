import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const isFirestoreUnavailable = () => !db;

export async function loadCart(userId) {
  if (isFirestoreUnavailable()) {
    return [];
  }

  try {
    const snapshot = await getDoc(doc(db, 'carts', String(userId)));
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
    await setDoc(doc(db, 'carts', String(userId)), { items, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.warn('Firestore cart save skipped', error);
  }
}

export async function clearCart(userId) {
  if (isFirestoreUnavailable()) {
    return;
  }

  try {
    await setDoc(doc(db, 'carts', String(userId)), { items: [], updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.warn('Firestore cart clear skipped', error);
  }
}
