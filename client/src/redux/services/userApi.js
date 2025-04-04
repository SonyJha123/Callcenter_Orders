import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUserByPhone: builder.query({
      query: (phone) => `/users/byphone/${phone}`,
      // Transform the response to handle all potential API response formats
      transformResponse: (response) => {
        return response;
      },
      // Handle errors including 404 not found
      onQueryStarted: async (phone, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error(`Error fetching user with phone ${phone}:`, error);
        }
      },
    }),
    createUser: builder.mutation({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
      }),
      // Transform response to make the API easier to use
      transformResponse: (response) => {
        return response;
      },
      // Invalidate the user cache when creating a new user
      invalidatesTags: ['User'],
      // Log when the query starts
      onQueryStarted: async (userData, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Error creating user:', error);
        }
      },
    }),
  }),
});

export const { 
  useGetUserByPhoneQuery,
  useLazyGetUserByPhoneQuery,
  useCreateUserMutation
} = userApi; 