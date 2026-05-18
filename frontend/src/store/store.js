import { configureStore } from "@reduxjs/toolkit";
import { statusApi } from "./rtkapi/statusApi";
import statusReducer from "./slices/statusSlice";

export const store = configureStore({
  reducer: {
    [statusApi.reducerPath]: statusApi.reducer,
    status:statusReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(statusApi.middleware),
});
