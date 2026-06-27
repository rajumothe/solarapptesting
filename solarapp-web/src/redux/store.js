/**
 * Redux Store Configuration
 * Global state management for SolarApp
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import leadsReducer from './slices/leadsSlice';
import ordersReducer from './slices/ordersSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadsReducer,
    orders: ordersReducer,
    ui: uiReducer,
    notifications: notificationReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['notifications/addNotification'],
        ignoredPaths: ['notifications.items']
      }
    })
});

export default store;
