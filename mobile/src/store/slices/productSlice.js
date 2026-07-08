import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  filterParams: {
    search: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    isFeatured: null,
    isNewArrival: null,
    isBestSeller: null,
    page: 1,
  },
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filterParams = { ...state.filterParams, ...action.payload };
    },
    resetFilter: (state) => {
      state.filterParams = initialState.filterParams;
    },
  },
});

export const { setFilter, resetFilter } = productSlice.actions;
export default productSlice.reducer;
