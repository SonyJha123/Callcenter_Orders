import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const restaurantApi = createApi({
  reducerPath: 'restaurantApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  endpoints: (builder) => ({
    // Menu endpoints
    getMenuList: builder.query({
      query: () => '/menu/menulist',
      transformResponse: (response) => {
        console.log('Raw menu list response:', response);
        if (response.menus) {
          return response.menus;
        } else if (response.data && response.data.menus) {
          return response.data.menus;
        } else if (Array.isArray(response)) {
          return response;
        }
        return [];
      }
    }),
    
    createMenu: builder.mutation({
      query: (menuData) => ({
        url: '/menu',
        method: 'POST',
        body: menuData,
      }),
    }),
    
    // Item endpoints
    getAllItems: builder.query({
      query: () => '/items/allitems',
      transformResponse: (response) => {
        console.log('Raw items response:', response);
        if (response.items) {
          return response.items;
        } else if (response.data && response.data.items) {
          return response.data.items;
        } else if (Array.isArray(response)) {
          return response;
        }
        return [];
      }
    }),
    
    getItemsByMenuId: builder.query({
      query: (menuId) => `/items/submenu/${menuId}`,
      transformResponse: (response) => {
        console.log('Raw items by menu response:', response);
        if (response.items) {
          return response.items;
        } else if (response.data && response.data.items) {
          return response.data.items;
        } else if (Array.isArray(response)) {
          return response;
        }
        return [];
      }
    }),
    
    getMenuItem: builder.query({
      query: (itemId) => `/items/${itemId}`,
    }),
    
    getAddOns: builder.query({
      query: (itemId) => `/items/suggestions/${itemId}`,
    }),
    
    searchItems: builder.query({
      query: (searchTerm) => `/items/search?query=${searchTerm}`,
    }),
    
    // Order endpoint remains the same
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
  useGetMenuListQuery,
  useCreateMenuMutation,
  useGetAllItemsQuery,
  useGetItemsByMenuIdQuery,
  useGetMenuItemQuery,
  useLazyGetMenuItemQuery,
  useGetAddOnsQuery,
  useSearchItemsQuery,
  useCreateOrderMutation
} = restaurantApi;
