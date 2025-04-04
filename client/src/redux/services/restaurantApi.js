
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
        if (response.menu_list) {
          return response.menu_list;
        } else if (response.data && response.data.menu_list) {
          return response.data.menu_list;
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
        if (response.menu_items) {
          return response.menu_items;
        } else if (response.data && response.data.menu_items) {
          return response.data.menu_items;
        } else if (Array.isArray(response)) {
          return response;
        }
        return [];
      }
    }),
    
    getMenuItem: builder.query({
      query: (itemId) => `/items/submenu/${itemId}`,
      transformResponse: (response) => {
        if (response.menu_items) {
          return response.menu_items;
        } else if (response.data && response.data.menu_items) {
          return response.data.menu_items;
        } else if (Array.isArray(response)) {
          return response;
        }
        return [];
      }
    }),
    
    getAddOns: builder.query({
      query: (itemId) => `/items/suggestions/${itemId}`,
    }),
    
    searchItems: builder.query({
      query: (searchTerm) => `/items/bykeyword?keyword=${searchTerm}`,
    }),
    
    // Order endpoint
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
