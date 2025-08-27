import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import reducers (we'll copy these from the web app)
import authReducer from '../../../shared/store/authSlice';
import leagueReducer from '../../../shared/store/leagueSlice';
import auctionReducer from '../../../shared/store/auctionSlice';
import nflReducer from '../../../shared/store/nflSlice';
import uiReducer from '../../../shared/store/uiSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'ui'], // Only persist auth and UI preferences
  blacklist: ['league', 'auction', 'nfl'], // Don't persist real-time data
};

// Auth slice persist config (for token and user data)
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['token', 'user', 'isAuthenticated'],
};

// UI slice persist config (for theme, preferences)
const uiPersistConfig = {
  key: 'ui',
  storage: AsyncStorage,
  whitelist: ['theme', 'notifications', 'preferences'],
};

// Create root reducer
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  league: leagueReducer,
  auction: auctionReducer,
  nfl: nflReducer,
  ui: persistReducer(uiPersistConfig, uiReducer),
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH',
        ],
        ignoredPaths: ['register'],
      },
      immutableCheck: {
        ignoredPaths: ['register'],
      },
    }),
  devTools: __DEV__,
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript (if using)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
