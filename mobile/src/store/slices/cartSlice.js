import { createSlice } from '@reduxjs/toolkit';

const calculateTotals = (items) => {
  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  return { totalCount, totalAmount };
};

const initialState = {
  items: [],
  totalAmount: 0,
  totalCount: 0,
  isGuestCart: true,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const item = action.payload;
      const existing = state.items.find((current) => current.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        state.items.push({ ...item, quantity: item.quantity || 1 });
      }
      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.totalCount = totals.totalCount;
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.totalCount = totals.totalCount;
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((current) => current.productId === productId);
      if (item) {
        item.quantity = quantity;
      }
      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.totalCount = totals.totalCount;
    },
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.totalCount = 0;
    },
    setGuestCart: (state, action) => {
      state.isGuestCart = action.payload;
    },
    loadCart: (state, action) => {
      state.items = action.payload;
      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.totalCount = totals.totalCount;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, setGuestCart, loadCart } = cartSlice.actions;
export default cartSlice.reducer;
