import { configureStore } from '@reduxjs/toolkit';
import { restaurantApi } from './services/restaurantApi';
import { userApi } from './services/userApi';

export const store = configureStore({
  reducer: {
    [restaurantApi.reducerPath]: restaurantApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      restaurantApi.middleware,
      userApi.middleware
    ),
});
