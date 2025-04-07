
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const restaurantApi = createApi({
  reducerPath: 'restaurantApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl,
    prepareHeaders: (headers) => {
      // Log API requests for debugging
      return headers;
    },
  }),
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
      query: (itemId) => `/items/${itemId}`,
      transformResponse: (response) => {
        if (response && response.item) {
          return response.item;
        } else if (response && response.data && response.data.item) {
          return response.data.item;
        } else if (response && !response.menu_items) {
          return response; // Direct item object
        }
        return null;
      }
    }),
    
    // Fixed and improved getAddOns endpoint
    getAddOns: builder.query({
      query: (itemId) => {
        return `/items/suggestions/${itemId}`;
      },
      transformResponse: (response, meta, arg) => {
        
        let addOns = [];
        
        if (response && response.data) {
          addOns = response.data;
        } else if (response && response.data && response.data.addOns) {
          addOns = response.data.addOns;
        } else if (Array.isArray(response)) {
          addOns = response;
        }
        
        
        return {
          data: addOns,
          itemId: arg
        };
      },
      // Add proper error handling
      onQueryStarted: async (itemId, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Error fetching add-ons for item ID", itemId, ":", error);
        }
      }
    }),
    
    // Improved search items endpoint with better response handling
    searchItems: builder.query({
      query: (searchTerm) => `/items/bykeyword?keyword=${searchTerm}`,
      transformResponse: (response) => {
        
        if (response && response.status === 'success' && Array.isArray(response.data)) {
          return { data: response.data };
        } else if (response && response.items) {
          return { data: response.items };
        } else if (response && response.data && Array.isArray(response.data.items)) {
          return { data: response.data.items };
        } else if (response && Array.isArray(response.data)) {
          return { data: response.data };
        } else if (Array.isArray(response)) {
          return { data: response };
        }
        
        // Return empty array if nothing matches
        return { data: [] };
      },
      // Add proper error handling
      onQueryStarted: async (searchTerm, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
        }
      }
    }),
    
    // Order endpoint
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders/createorder',
        method: 'POST',
        body: orderData,
      }),
    }),
    
    getOrderById: builder.query({
      query: (orderId) => `/orders/${orderId}`,
      transformResponse: (response) => {
        if (response && response.order) {
          return response.order;
        } else if (response && response.data && response.data.order) {
          return response.data.order;
        } else {
          return response;
        }
      }
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
  useCreateOrderMutation,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useLazySearchItemsQuery
} = restaurantApi;
