/**
 * Leads Redux Slice - Handles leads state
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api';

export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async ({ page = 1, limit = 20, filters = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        limit,
        offset: (page - 1) * limit,
        ...filters
      });
      const response = await API.get(`/leads/list?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createLead = createAsyncThunk(
  'leads/createLead',
  async (leadData, { rejectWithValue }) => {
    try {
      const response = await API.post('/leads/create', leadData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const searchLeads = createAsyncThunk(
  'leads/searchLeads',
  async (searchTerm, { rejectWithValue }) => {
    try {
      const response = await API.get(`/leads/list?search=${searchTerm}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
  filters: {}
};

const leadsSlice = createSlice({
  name: 'leads',
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
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.total = action.payload.total;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(searchLeads.fulfilled, (state, action) => {
        state.items = action.payload.data || [];
      });
  }
});

export const { setFilters, setPage, clearError } = leadsSlice.actions;
export default leadsSlice.reducer;
