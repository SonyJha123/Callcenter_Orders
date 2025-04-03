import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const restaurantApi = createApi({
  reducerPath: 'restaurantApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  endpoints: (builder) => ({
    getAllRestaurants: builder.query({
      query: ({ page = 1, limit = 10 }) => `/restaurants/allrestaurants?page=${page}&limit=${limit}`,
      transformResponse: (response) => {
        console.log('Raw restaurant API response:', response);
        if (response.restaurants) {
          return response;
        } else if (response.data && response.data.restaurants) {
          return response.data;
        } else if (Array.isArray(response)) {
          return { restaurants: response };
        }
        return { restaurants: [] };
      },
      transformErrorResponse: (error) => {
        console.error('Restaurant API error:', error);
        return error;
      }
    }),
    getSubRestaurants: builder.query({
      query: ({ restaurantId, page = 1, limit = 10 }) => 
        `/subrestaurants/allsubrestaurants/${restaurantId}?page=${page}&limit=${limit}`,
    }),
    getMenus: builder.query({
      query: (subRestaurantId) => `/menu/menulist/${subRestaurantId}`,
    }),
    getMenuItems: builder.query({
      query: (menuId) => `/items/submenu/${menuId}`,
    }),
    searchItems: builder.query({
      query: (searchTerm) => `/restaurants/bykeyword?search=${searchTerm}`,
    }),
    getAddOns: builder.query({
      query: (itemId) => `/items/suggestions/${itemId}`,
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders/createorder',
        method: 'POST',
        body: orderData,
      }),
    }),
  }),
});

export const { 
  useGetAllRestaurantsQuery, 
  useGetSubRestaurantsQuery, 
  useGetMenusQuery, 
  useGetMenuItemsQuery,
  useSearchItemsQuery,
  useGetAddOnsQuery,
  useCreateOrderMutation
} = restaurantApi;
