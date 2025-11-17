// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { Restaurant } from '../../types/restaurentTypes';

// export interface User {
//   id: string
//   userName: string
//   email: string
//   phoneNumber:string
//   fullName:string
//   avatar?: string
//   isVerified: boolean
// }

// export interface AuthInfo{
//   token:string,
//   user:User
// }

// const initialState: AuthInfo = {
//   user: null,
//   token: "",
// };

// const restaurantSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     updateRestaurant: (state, action: PayloadAction<Partial<Restaurant>>) => {
//       state.restaurant = {
//         ...state.restaurant,
//         ...action.payload,
//       };
//     },
//     // updateOperatingHours: (state, action: PayloadAction<{ opening: string; closing: string }>) => {
//     //   state.restaurant.operatingHours = action.payload;
//     // },
//     // updateTaxRate: (state, action: PayloadAction<number>) => {
//     //   state.restaurant.taxRate = action.payload;
//     // },
//   },
// });

// export const { updateRestaurant } = restaurantSlice.actions;
// export default restaurantSlice.reducer;