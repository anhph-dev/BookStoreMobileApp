const pick = (source, camelKey, pascalKey) => source?.[camelKey] ?? source?.[pascalKey] ?? null;

export function normalizeProduct(product = {}) {
  return {
    ...product,
    productId: pick(product, 'productId', 'ProductId'),
    productName: pick(product, 'productName', 'ProductName'),
    author: pick(product, 'author', 'Author'),
    publisher: pick(product, 'publisher', 'Publisher'),
    isbn: pick(product, 'isbn', 'ISBN'),
    price: pick(product, 'price', 'Price'),
    originalPrice: pick(product, 'originalPrice', 'OriginalPrice'),
    discountPercent: pick(product, 'discountPercent', 'DiscountPercent'),
    stock: pick(product, 'stock', 'Stock'),
    imageUrl: pick(product, 'imageUrl', 'ImageUrl'),
    averageRating: pick(product, 'averageRating', 'AverageRating'),
    reviewCount: pick(product, 'reviewCount', 'ReviewCount'),
    isFeatured: pick(product, 'isFeatured', 'IsFeatured'),
    isNewArrival: pick(product, 'isNewArrival', 'IsNewArrival'),
    isBestSeller: pick(product, 'isBestSeller', 'IsBestSeller'),
    isAvailable: pick(product, 'isAvailable', 'IsAvailable'),
    categoryId: pick(product, 'categoryId', 'CategoryId'),
    categoryName: pick(product, 'categoryName', 'CategoryName'),
    shortDescription: pick(product, 'shortDescription', 'ShortDescription'),
    description: pick(product, 'description', 'Description'),
  };
}

export function normalizeCategory(category = {}) {
  return {
    ...category,
    categoryId: pick(category, 'categoryId', 'CategoryId'),
    categoryName: pick(category, 'categoryName', 'CategoryName'),
  };
}

export function normalizeOrderItem(item = {}) {
  return {
    ...item,
    orderDetailId: pick(item, 'orderDetailId', 'OrderDetailId'),
    orderId: pick(item, 'orderId', 'OrderId'),
    productId: pick(item, 'productId', 'ProductId'),
    productName: pick(item, 'productName', 'ProductName'),
    imageUrl: pick(item, 'imageUrl', 'ImageUrl'),
    quantity: pick(item, 'quantity', 'Quantity'),
    unitPrice: pick(item, 'unitPrice', 'UnitPrice'),
  };
}

export function normalizeOrder(order = {}) {
  return {
    ...order,
    orderId: pick(order, 'orderId', 'OrderId'),
    userId: pick(order, 'userId', 'UserId'),
    totalAmount: pick(order, 'totalAmount', 'TotalAmount'),
    status: pick(order, 'status', 'Status'),
    orderDate: pick(order, 'orderDate', 'OrderDate'),
    recipientName: pick(order, 'recipientName', 'RecipientName'),
    phoneNumber: pick(order, 'phoneNumber', 'PhoneNumber'),
    email: pick(order, 'email', 'Email'),
    shippingAddress: pick(order, 'shippingAddress', 'ShippingAddress'),
    notes: pick(order, 'notes', 'Notes'),
    paymentMethod: pick(order, 'paymentMethod', 'PaymentMethod'),
    paymentStatus: pick(order, 'paymentStatus', 'PaymentStatus'),
    cityId: pick(order, 'cityId', 'CityId'),
    wardId: pick(order, 'wardId', 'WardId'),
    cityName: pick(order, 'cityName', 'CityName'),
    wardName: pick(order, 'wardName', 'WardName'),
    items: Array.isArray(order?.items) ? order.items.map(normalizeOrderItem) : order?.items,
  };
}

export function normalizeCity(city = {}) {
  return {
    ...city,
    cityId: pick(city, 'cityId', 'CityId'),
    cityName: pick(city, 'cityName', 'CityName'),
  };
}

export function normalizeWard(ward = {}) {
  return {
    ...ward,
    wardId: pick(ward, 'wardId', 'WardId'),
    wardName: pick(ward, 'wardName', 'WardName'),
    cityId: pick(ward, 'cityId', 'CityId'),
  };
}