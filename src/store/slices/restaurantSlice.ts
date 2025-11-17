import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Restaurant } from '../../types/restaurentTypes';

interface RestaurantState {
  restaurant: Restaurant;
  loading: boolean;
  error: string | null;
}

const initialState: RestaurantState = {
  restaurant: null,
  loading: false,
  error: null,
};

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    updateRestaurant: (state, action: PayloadAction<Partial<Restaurant>>) => {
      state.restaurant = {
        ...state.restaurant,
        ...action.payload,
      };
    },
    // updateOperatingHours: (state, action: PayloadAction<{ opening: string; closing: string }>) => {
    //   state.restaurant.operatingHours = action.payload;
    // },
    // updateTaxRate: (state, action: PayloadAction<number>) => {
    //   state.restaurant.taxRate = action.payload;
    // },
  },
});

export const { updateRestaurant } = restaurantSlice.actions;
export default restaurantSlice.reducer;