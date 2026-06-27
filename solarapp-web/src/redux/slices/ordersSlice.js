/**
 * Orders Redux Slice - Handles orders state
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ page = 1, limit = 20, filters = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        limit,
        offset: (page - 1) * limit,
        ...filters
      });
      const response = await API.get(`/orders/list?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const collectPayment = createAsyncThunk(
  'orders/collectPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await API.post('/orders/collect-payment', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const initialState = {
  items: [],
  selectedOrder: null,
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  paymentLoading: false,
  error: null,
  filters: {}
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.selectedOrder = action.payload;
      })
      .addCase(collectPayment.pending, (state) => {
        state.paymentLoading = true;
      })
      .addCase(collectPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        if (state.selectedOrder) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(collectPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setFilters, setPage, clearError } = ordersSlice.actions;
export default ordersSlice.reducer;
