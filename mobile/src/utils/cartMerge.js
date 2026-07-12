export function mergeItems(guestItems = [], firestoreItems = []) {
  const mergedMap = new Map();

  [...guestItems, ...firestoreItems].forEach((item) => {
    if (!item?.productId) {
      return;
    }

    const current = mergedMap.get(item.productId);
    if (!current) {
      mergedMap.set(item.productId, { ...item });
      return;
    }

    mergedMap.set(item.productId, {
      ...current,
      quantity: Math.max(Number(current.quantity || 0), Number(item.quantity || 0)),
    });
  });

  return Array.from(mergedMap.values());
}
