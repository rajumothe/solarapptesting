/**
 * Notification Redux Slice - Handles toast notifications
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: []
};

let notificationId = 0;

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const id = notificationId++;
      state.items.push({
        id,
        type: action.payload.type || 'info', // success, error, warning, info
        message: action.payload.message,
        duration: action.payload.duration || 3000,
        timestamp: Date.now()
      });
    },
    removeNotification: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.items = [];
    }
  }
});

export const { addNotification, removeNotification, clearNotifications } = notificationSlice.actions;

// Async action helper
export const addNotificationAsync = (notification) => (dispatch) => {
  dispatch(addNotification(notification));
  if (notification.duration > 0) {
    setTimeout(() => {
      dispatch(removeNotification(notification.id || notificationId - 1));
    }, notification.duration);
  }
};

export default notificationSlice.reducer;
