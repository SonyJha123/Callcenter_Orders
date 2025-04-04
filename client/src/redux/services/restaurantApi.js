
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
      query: (itemId) => {
        // Extract the item ID properly, handling different formats
        let id = '';
        
        if (!itemId) {
          console.error('Invalid itemId provided to getMenuItem:', itemId);
          return { url: '/items/item/null', method: 'GET' };
        }
        
        // If itemId is an object with item_id property
        if (typeof itemId === 'object' && itemId !== null) {
          if (itemId.item_id) {
            // Handle case where item_id is an object with _id
            if (typeof itemId.item_id === 'object' && itemId.item_id._id) {
              id = itemId.item_id._id;
              console.log(`Using _id from item_id object: ${id}`);
            } else {
              // Handle case where item_id is already the ID string
              id = itemId.item_id;
              console.log(`Using item_id directly: ${id}`);
            }
          } else if (itemId._id) {
            id = itemId._id;
            console.log(`Using _id from itemId object: ${id}`);
          } else if (itemId.id) {
            id = itemId.id;
            console.log(`Using id from itemId object: ${id}`);
          }
        } else {
          // If it's a string or number, use directly
          id = String(itemId);
          console.log(`Using itemId as string: ${id}`);
        }
        
        console.log('Fetching menu item with extracted ID:', id);
        return { 
          url: `/items/item/${id}`,
          method: 'GET'
        };
      },
      transformResponse: (response) => {
        console.log('getMenuItem response:', response);
        // Ensure we preserve all item data including addOns if they exist
        return response;
      },
      transformErrorResponse: (response, meta, arg) => {
        console.error('Error fetching menu item:', { response, meta, arg });
        return response;
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
