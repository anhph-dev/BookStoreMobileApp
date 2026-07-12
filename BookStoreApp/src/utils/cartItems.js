export function buildCartItem(product, quantity = 1) {
  // Sản phẩm có thể đến từ API đã normalize hoặc payload cũ, nên hỗ trợ cả camelCase/PascalCase.
  return {
    productId: product.productId ?? product.ProductId,
    productName: product.productName ?? product.ProductName,
    imageUrl: product.imageUrl ?? product.ImageUrl,
    price: Number(product.price ?? product.Price ?? 0),
    quantity,
  };
}

export function getNextCartItems(items = [], cartItem) {
  // Đồng bộ logic với cartSlice.addItem để dữ liệu persist khớp state Redux kế tiếp.
  const existingItem = items.find((item) => item.productId === cartItem.productId);

  if (existingItem) {
    return items.map((item) => (
      item.productId === cartItem.productId
        ? { ...item, quantity: item.quantity + cartItem.quantity }
        : item
    ));
  }

  return [...items, cartItem];
}
