/**
 * UI Redux Slice - Handles UI state
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  darkMode: localStorage.getItem('darkMode') === 'true',
  loading: false,
  modal: {
    isOpen: false,
    type: null,
    data: null
  },
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode.toString());
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    openModal: (state, action) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data || null
      };
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null
      };
    },
    openConfirmDialog: (state, action) => {
      state.confirmDialog = {
        isOpen: true,
        title: action.payload.title,
        message: action.payload.message,
        onConfirm: action.payload.onConfirm
      };
    },
    closeConfirmDialog: (state) => {
      state.confirmDialog = {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
      };
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setLoading,
  openModal,
  closeModal,
  openConfirmDialog,
  closeConfirmDialog
} = uiSlice.actions;

export default uiSlice.reducer;
