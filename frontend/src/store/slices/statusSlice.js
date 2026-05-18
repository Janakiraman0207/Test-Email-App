import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentStatus: {
    label: "Available",
    value: "available",
  },
};

const statusSlice = createSlice({
  name: "status",

  initialState,

  reducers: {
    setCurrentStatus: (state, action) => {
      state.currentStatus = action.payload;
    },
  },
});

export const {
  setCurrentStatus,
} = statusSlice.actions;

export default statusSlice.reducer;