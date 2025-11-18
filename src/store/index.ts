import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { PersistConfig } from 'redux-persist/es/types';
import authSlice from './slices/authSlice';
import tablesSlice from './slices/tablesSlice';
import menuCategoriesSlice from './slices/menuCategoriesSlice';
import menuItemsSlice from './slices/menuItemsSlice';
import ordersSlice from './slices/ordersSlice';
import usersSlice from './slices/usersSlice';
import restaurantSlice from './slices/restaurantSlice';
import qrCodesSlice from './slices/qrCodesSlice';
import loyaltySlice from './slices/loyaltySlice';
import stateSlice from './slices/stateSlice';
import expensesSlice from './slices/expensesSlice';

// Persist configuration
const persistConfig: PersistConfig<any> = {
  key: 'root',
  storage,
  whitelist: [
    'auth',
    'tables', 
    'menuCategories',
    'menuItems',
    'orders',
    'users',
    'restaurant',
    'qrCodes',
    'loyalty',
    'states',
    'expenses'
  ],
  blacklist: [], // Add any slices you don't want to persist
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
  timeout: null, // No timeout for rehydration
  migrate: (state: any) => {
    // Migration logic for future schema changes
    return Promise.resolve(state);
  },
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, combineReducers({
  auth: authSlice,
  tables: tablesSlice,
  menuCategories: menuCategoriesSlice,
  menuItems: menuItemsSlice,
  orders: ordersSlice,
  users: usersSlice,
  restaurant: restaurantSlice,
  qrCodes: qrCodesSlice,
  loyalty: loyaltySlice,
  states: stateSlice,
  expenses: expensesSlice
}));

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;