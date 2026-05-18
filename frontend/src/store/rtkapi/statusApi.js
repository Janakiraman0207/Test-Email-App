import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { updateUserStatus } from "../../api/api";

export const statusApi = createApi({
  reducerPath: "statusApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    updateProfileStatus: builder.mutation({
      async queryFn(payload) {
        try {
          const response = await updateUserStatus(payload);
          return { data: response.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
    }),
  }),
});

export const { useUpdateProfileStatusMutation } = statusApi;
