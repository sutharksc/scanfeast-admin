import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { States } from "../../services/lookupService";

interface StatesState {
  data: States[] | null;
  loading: boolean;
}

const initialState: StatesState = {
  data: null,
  loading: false,
};

const stateSlice = createSlice({
  name: "states",
  initialState,
  reducers: {
    setStates: (state, action: PayloadAction<States[]>) => {
      state.data = action.payload;
    },
    setStatesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setStates, setStatesLoading } = stateSlice.actions;
export default stateSlice.reducer;
